import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import HomeScreen from "./src/screens/HomeScreen"
import GroupScreen from "./src/screens/GroupScreen"
import { ToastProvider } from "./src/components/ToastProvider"

const Stack = createNativeStackNavigator()

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
            <Stack.Screen
              name="Group"
              component={GroupScreen}
              options={({ route }) => ({
                title: route.params?.groupName || "Group",
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ToastProvider>
    </SafeAreaProvider>
  )
}
