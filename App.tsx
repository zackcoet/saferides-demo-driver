import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './services/AuthContext';
import TabNavigator from './navigation/TabNavigator';
import { AuthNavigator } from './navigation/AuthNavigator';

function Navigation() {
  const { user } = useAuth();
  return user ? <TabNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Navigation />
      </NavigationContainer>
    </AuthProvider>
  );
}
