import { Stack } from "expo-router";

const CompetitionLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Competition" }}
      />
      <Stack.Screen
        name="ActiveCompetition"
        options={{ headerShown: false, title: "Active Competition" }}
      />
       <Stack.Screen
        name="TurnOutResult"
        options={{ headerShown: false, title: "Turn Out Results" }}
      />
        <Stack.Screen
        name="waiting-room"
        options={{ headerShown: false, title: "Waiting-Room" }}
      />
    </Stack>
  );
};

export default CompetitionLayout;
