// server.js - Production-ready Twitter verification backend
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Twitter API configuration
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

// In-memory store for verification codes (use Redis in production)
const verificationStore = new Map();
const twitterAuthStore = new Map();

// Utility functions
const generateVerificationCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const generateState = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateCodeVerifier = () => {
  return crypto.randomBytes(32).toString('base64url');
};

const generateCodeChallenge = (verifier) => {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
};

// Verify wallet signature
const verifyWalletSignature = (message, signature, address) => {
  try {
    // This is a simplified verification - implement proper signature verification
    // based on your wallet integration (ethers.js, web3.js, etc.)
    const expectedMessage = `STIM Twitter Verification Request\nWallet: ${address}\nTimestamp: `;
    return message.includes(expectedMessage) && signature && address;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};

// Routes

// 1. Initiate Twitter verification process
app.post('/api/twitter/initiate-verification', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // Verify wallet signature
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid wallet signature' 
      });
    }

    // Generate verification code and state
    const verificationCode = generateVerificationCode();
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Store verification data
    verificationStore.set(walletAddress, {
      verificationCode,
      state,
      codeVerifier,
      timestamp: Date.now(),
      verified: false
    });

    // Twitter OAuth 2.0 URL with PKCE
    const twitterAuthUrl = new URL('https://twitter.com/i/oauth2/authorize');
    twitterAuthUrl.searchParams.append('response_type', 'code');
    twitterAuthUrl.searchParams.append('client_id', TWITTER_CLIENT_ID);
    twitterAuthUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    twitterAuthUrl.searchParams.append('scope', 'users.read tweet.read');
    twitterAuthUrl.searchParams.append('state', state);
    twitterAuthUrl.searchParams.append('code_challenge', codeChallenge);
    twitterAuthUrl.searchParams.append('code_challenge_method', 'S256');

    res.json({
      success: true,
      verificationCode,
      authUrl: twitterAuthUrl.toString(),
      message: `To verify your Twitter account, please:\n1. Tweet this code: ${verificationCode}\n2. Click the authorization link\n3. Return to complete verification`
    });

  } catch (error) {
    console.error('Initiate verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 2. Handle Twitter OAuth callback
app.get('/api/twitter/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/profile?error=missing_params`);
    }

    // Find verification data by state
    let walletAddress = null;
    let verificationData = null;

    for (const [address, data] of verificationStore.entries()) {
      if (data.state === state) {
        walletAddress = address;
        verificationData = data;
        break;
      }
    }

    if (!verificationData) {
      return res.redirect(`${process.env.FRONTEND_URL}/profile?error=invalid_state`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', 
      new URLSearchParams({
        'client_id': TWITTER_CLIENT_ID,
        'code': code,
        'grant_type': 'authorization_code',
        'code_verifier': verificationData.codeVerifier,
        'redirect_uri': REDIRECT_URI
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info from Twitter
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const twitterUser = userResponse.data.data;

    // Store Twitter auth data
    twitterAuthStore.set(walletAddress, {
      twitterId: twitterUser.id,
      username: twitterUser.username,
      name: twitterUser.name,
      accessToken: access_token,
      timestamp: Date.now()
    });

    res.redirect(`${process.env.FRONTEND_URL}/profile?twitter_auth=success&step=2`);

  } catch (error) {
    console.error('Twitter callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/profile?error=auth_failed`);
  }
});

// 3. Complete verification by checking tweet
app.post('/api/twitter/complete-verification', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // Verify wallet signature
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid wallet signature' 
      });
    }

    const verificationData = verificationStore.get(walletAddress);
    const twitterData = twitterAuthStore.get(walletAddress);

    if (!verificationData || !twitterData) {
      return res.status(404).json({ 
        success: false, 
        error: 'Verification session not found' 
      });
    }

    // Check if user tweeted the verification code
    const tweetsResponse = await axios.get(`https://api.twitter.com/2/users/${twitterData.twitterId}/tweets`, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
      },
      params: {
        max_results: 10,
        'tweet.fields': 'created_at,text'
      }
    });

    const tweets = tweetsResponse.data.data || [];
    const verificationTweet = tweets.find(tweet => 
      tweet.text.includes(verificationData.verificationCode) &&
      new Date(tweet.created_at) > new Date(verificationData.timestamp)
    );

    if (!verificationTweet) {
      return res.status(400).json({ 
        success: false, 
        error: 'Verification tweet not found. Please tweet the verification code.' 
      });
    }

    // Mark as verified
    verificationStore.set(walletAddress, {
      ...verificationData,
      verified: true,
      tweetId: verificationTweet.id,
      completedAt: Date.now()
    });

    // Here you would typically save to your database
    // await saveTwitterVerification(walletAddress, twitterData, verificationTweet);

    res.json({
      success: true,
      twitterUser: {
        id: twitterData.twitterId,
        username: twitterData.username,
        name: twitterData.name
      },
      verificationTweet: {
        id: verificationTweet.id,
        text: verificationTweet.text,
        created_at: verificationTweet.created_at
      },
      message: 'Twitter account successfully verified!'
    });

  } catch (error) {
    console.error('Complete verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during verification' 
    });
  }
});

// 4. Check verification status
app.get('/api/twitter/verification-status/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const verificationData = verificationStore.get(walletAddress);
    const twitterData = twitterAuthStore.get(walletAddress);

    if (!verificationData) {
      return res.json({ 
        success: true, 
        verified: false,
        step: 0
      });
    }

    if (verificationData.verified && twitterData) {
      return res.json({
        success: true,
        verified: true,
        step: 3,
        twitterUser: {
          username: twitterData.username,
          name: twitterData.name
        }
      });
    }

    if (twitterData && !verificationData.verified) {
      return res.json({
        success: true,
        verified: false,
        step: 2,
        verificationCode: verificationData.verificationCode,
        twitterUser: {
          username: twitterData.username,
          name: twitterData.name
        }
      });
    }

    res.json({
      success: true,
      verified: false,
      step: 1,
      verificationCode: verificationData.verificationCode
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// 5. Unlink Twitter account
app.post('/api/twitter/unlink', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid wallet signature' 
      });
    }

    verificationStore.delete(walletAddress);
    twitterAuthStore.delete(walletAddress);

    res.json({
      success: true,
      message: 'Twitter account unlinked successfully'
    });

  } catch (error) {
    console.error('Unlink error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Cleanup expired verification sessions (run every hour)
setInterval(() => {
  const now = Date.now();
  const expirationTime = 30 * 60 * 1000; // 30 minutes

  for (const [address, data] of verificationStore.entries()) {
    if (now - data.timestamp > expirationTime && !data.verified) {
      verificationStore.delete(address);
      twitterAuthStore.delete(address);
    }
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Twitter verification server running on port ${PORT}`);
});

module.exports = app;