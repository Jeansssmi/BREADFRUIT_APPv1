import { useAuth } from '../context/AuthContext';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

// Import all your main navigators
import AdminNavigator from './AdminNavigator';
import AuthNavigator from './AuthNavigator';
import ResearcherNavigator from './ResearcherNavigator';
import ViewerNavigator from './ViewerNavigator'; // UPDATED: Uncommented this line

export default function RootNavigator() {
  const { user, initialized } = useAuth();

  if (!initialized) {
    // Show a loading screen while auth state is checked
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Based on the user and their role, show the correct navigator
  if (user) {
    switch (user.role) {
      case 'admin':
        return <AdminNavigator />;
      case 'researcher':
        return <ResearcherNavigator />;
      case 'viewer': // UPDATED: Added the viewer case
        return <ViewerNavigator />;
      default:
        // Fallback for unknown roles
        return <AuthNavigator />;
    }
  } else {
    // No user is logged in
    return <AuthNavigator />;
  }
}