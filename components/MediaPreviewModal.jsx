// // components/MediaPreviewModal.jsx
// import { Modal, TouchableOpacity, View, Text } from "react-native";
// import ImageViewing from "react-native-image-viewing";
// import Video from "react-native-video";
// import { useMediaPreviewStore } from "@/backend/store/mediaPreviewStore";

// export default function MediaPreviewModal() {
//   const { visible, media, hide } = useMediaPreviewStore();

//   if (!media) return null;

//   return (
//     <Modal visible={visible} transparent animationType="fade">
//       <View className="flex-1 bg-black justify-center items-center">
//         {media.type === "image" ? (
//           <ImageViewing
//             images={[{ uri: media.uri }]}
//             imageIndex={0}
//             visible={visible}
//             onRequestClose={hide}
//           />
//         ) : (
//           <View className="w-full h-full justify-center items-center bg-black">
//             <TouchableOpacity
//               onPress={hide}
//               className="absolute top-10 right-5 z-10"
//             >
//               <Text className="text-white text-xl">✕</Text>
//             </TouchableOpacity>
//             <Video
//               source={{ uri: media.uri }}
//               style={{ width: "100%", height: 300 }}
//               controls
//               resizeMode="contain"
//             />
//           </View>
//         )}
//       </View>
//     </Modal>
//   );
// }
