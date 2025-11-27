"use client"

import { useState, Suspense, lazy, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import Navbar from "./components/Navbar"
import Header from "./components/Header"
import Login from "./components/Login"
import Profile from "./components/userProfile"
import BetHistory from "./pages/BetHistory"
import ClaimRewards from './components/ClaimRewards';
import { EditModal, LanguageModal, AvatarModal } from "./components/EditModals"
import VerifyTask from "./components/VerifyTask"
import Welcome from "./pages/Welcome"

// Public Imports
import ConfirmPrediction from "./pages/PublicPage/ConfirmPrediction"
import PredictionSuccess from "./pages/PublicPage/PredictionSuccess"
import EnhancedPredictionWin from "./pages/PublicPage/PredictionWin"
import EnhancedPredictionLoss from "./pages/PublicPage/PredictionLoss"
import EventDetail from "./pages/PublicPage/EventDetail"

// Private Imports
import Private from "./pages/PrivatePage/Private"
import CreatePool from "./pages/PrivatePage/CreatePool"
import PoolSummary from "./pages/PrivatePage/PoolSummary"
import PoolCreatedSuccess from "./pages/PrivatePage/PoolCreatedSuccess"
import PrivateInvite from "./pages/PrivatePage/PrivateInvite"
import PrivatePredict from "./pages/PrivatePage/PrivatePredict"

import Stake from "./pages/PublicPage/Home"
import Wallet from "./pages/Wallet"
import Friends from "./pages/Friends"
import Reward from "./pages/Reward"
import Play from "./pages/Play"

// Lazy load components
const Public = lazy(() => import("./pages/PublicPage/Home"))
const Prediction = lazy(() => import("./pages/PublicPage/Prediction"))
const AllBets = lazy(() => import("./components/ui/historyComponent/AllBets"))

// Import Web3Provider with ConnectKit
import { Web3Provider } from "./components/connectWallet/Web3Provider"
import CreateEvent from "./pages/PublicPage/CreateEvent"

// Import NotificationProvider
import { NotificationProvider } from "./components/NotificationProvider"

// Create a simple locale context (no translation, just for compatibility)
import { createContext, useContext } from 'react'

const LocaleContext = createContext()

export const useLocale = () => {
  const context = useContext(LocaleContext)
  if (!context) {
    return { locale: 'en', setLocale: () => {}, supportedLanguages: ['en'] }
  }
  return context
}

// Simple locale provider (no actual translation)
const LocaleProvider = ({ children }) => {
  const [locale, setLocale] = useState('en')
  const supportedLanguages = ['en']

  return (
    <LocaleContext.Provider value={{ locale, setLocale, supportedLanguages }}>
      {children}
    </LocaleContext.Provider>
  )
}

// ScrollToTop component - scrolls to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll the main window to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    // Also scroll any scrollable containers
    const scrollContainer = document.querySelector('.overflow-auto');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

// Layout component that conditionally renders Header and Navbar
const AppLayout = () => {
  const location = useLocation()
  const [walletBalance, setWalletBalance] = useState(null)
  const [user, setUser] = useState(null)

  const noHeaderNavbarRoutes = ["/", "/welcome", "/login"]
  const hideNavAndHeader = noHeaderNavbarRoutes.includes(location.pathname)

  return (
    <div className="fixed inset-0 bg-[#09113B] overflow-auto">
      {/* Add ScrollToTop component here */}
      <ScrollToTop />
      
      {!hideNavAndHeader && (
        <Header 
          key={walletBalance} 
          walletBalance={walletBalance} 
          setWalletBalance={setWalletBalance} 
        />
      )}

      <div className={hideNavAndHeader ? "" : "pb-24"}>
        <Suspense 
          fallback={
            <div className="flex items-center justify-center h-screen text-white text-xl">
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/welcome" element={<Welcome />} />
            
            <Route path="/login" element={<Login />} />
            <Route path="/predict" element={<Stake />} />
            <Route path="/play" element={<Play />} />
            <Route path="/rewards" element={<Reward />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/event/:eventAddress" element={<EventDetail />} />

            <Route path="/profile" element={<Profile />} />
            <Route path="/edit/avatar" element={<AvatarModal />} />
            <Route 
              path="/edit/username" 
              element={<EditModal title="Profile Handle" type="username" />} 
            />
            <Route path="/bet-history" element={<BetHistory />} />
            <Route 
              path="/edit/name" 
              element={<EditModal title="Profile Name" type="name" />} 
            />
            <Route 
              path="/edit/email" 
              element={<EditModal title="Email Address" type="email" />} 
            />
            <Route 
              path="/edit/location" 
              element={<EditModal title="Location" type="location" />} 
            />
            <Route path="/edit/language" element={<LanguageModal />} />
            
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/confirm-prediction" element={<ConfirmPrediction />} />
            <Route path="/prediction-success" element={<PredictionSuccess />} />
            <Route path="/claim-rewards" element={<ClaimRewards />} />
            <Route path="/prediction-win" element={<EnhancedPredictionWin />} />
            <Route path="/prediction-win/:eventAddress" element={<EnhancedPredictionWin />} />
            <Route path="/prediction-loss" element={<EnhancedPredictionLoss />} />
            <Route path="/prediction-loss/:eventAddress" element={<EnhancedPredictionLoss />} />

            <Route path="/private" element={<Private />} />
            <Route path="/create-pool" element={<CreatePool />} />
            <Route path="/pool-summary" element={<PoolSummary />} />
            <Route path="/pool-success" element={<PoolCreatedSuccess />} />
            <Route path="/private-invite" element={<PrivateInvite />} />
            <Route path="/private-predict" element={<PrivatePredict />} />

            <Route path="/verify-task" element={<VerifyTask />} />

            <Route path="/wallet" element={<Wallet user={user} setWalletBalance={setWalletBalance} />} />
          </Routes>
        </Suspense>
      </div>

      {!hideNavAndHeader && <Navbar />}
    </div>
  )
}

function App() {
  return (
    <Web3Provider>
      <Router>
        <NotificationProvider>
          <AppLayout />
          <ToastContainer position="top-right" autoClose={5000} />
        </NotificationProvider>
      </Router>
    </Web3Provider>
  )
}

export default App