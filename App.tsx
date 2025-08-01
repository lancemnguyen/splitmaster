import { StatusBar } from "react-native"
import Toast from "react-native-toast-message"
import AppNavigator from "./src/navigation/AppNavigator"

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppNavigator />
      <Toast />
    </>
  )
}
