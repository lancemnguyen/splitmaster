import { NavigationContainer } from "@react-navigation/native"
import { createStackNavigator } from "@react-navigation/stack"
import HomeScreen from "../screens/HomeScreen"
import GroupScreen from "../screens/GroupScreen"

export type RootStackParamList = {
  Home: undefined
  Group: { groupId: string }
}

const Stack = createStackNavigator<RootStackParamList>()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "WiseSplit" }} />
        <Stack.Screen name="Group" component={GroupScreen} options={{ title: "Group Details" }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
