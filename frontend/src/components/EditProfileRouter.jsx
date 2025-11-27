import React from 'react';
import { useParams } from 'react-router-dom';
import { EditModal, AvatarModal, LanguageModal } from './EditModals';

const EditProfileRouter = () => {
  const { editType } = useParams();

  const getModalTitle = (type) => {
    switch(type) {
      case 'username':
        return 'Username';
      case 'name':
        return 'Name';
      case 'email':
        return 'Email Address';
      case 'location':
        return 'Location';
      case 'avatar':
        return 'Avatar';
      case 'language':
        return 'Language';
      default:
        return 'Profile';
    }
  };

  // Render appropriate modal based on edit type
  switch(editType) {
    case 'avatar':
      return <AvatarModal />;
    case 'language':
      return <LanguageModal />;
    case 'username':
    case 'name':
    case 'email':
    case 'location':
      return <EditModal title={getModalTitle(editType)} type={editType} />;
    default:
      return null;
  }
};

export default EditProfileRouter;