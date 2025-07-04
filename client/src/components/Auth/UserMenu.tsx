import { getCurrentUser, signOutUser } from '../../services/authService';

interface UserMenuProps {
  onLogout: () => void;
}

const UserMenu = ({ onLogout }: UserMenuProps) => {
  const currentUser = getCurrentUser();
  
  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      await signOutUser();
      console.log("Firebase logout successful");
      onLogout();
      console.log("App state reset completed");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  return (
    <div className="user-menu">
      <span className="user-email">{currentUser?.email}</span>
      <button 
        className="btn btn-small" 
        onClick={handleLogout}
      >
        Log Out
      </button>
    </div>
  );
};

export default UserMenu;