import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ToastProvider } from "./components/ToastProvider"
import HomeScreen from "./screens/HomeScreen"
import GroupScreen from "./screens/GroupScreen"

export type RootStackParamList = {
  Home: undefined
  Group: { groupId: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function App() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: "#2563eb",
              },
              headerTintColor: "#fff",
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "WiseSplit" }} />
            <Stack.Screen name="Group" component={GroupScreen} options={{ title: "Group Details" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaProvider>
  )
}
