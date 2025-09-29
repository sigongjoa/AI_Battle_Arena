import cv2
import mediapipe as mp
import json
from typing import List, Dict, Any

class PoseExtractor:
    """
    비디오에서 포즈 랜드마크를 추출하여 JSON 파일로 저장하는 클래스.
    """

    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5)
        self.mp_drawing = mp.solutions.drawing_utils

    def extract_from_video(self, video_path: str, output_path: str, show_preview: bool = False) -> bool:
        """
        비디오 파일에서 Pose 데이터를 추출하여 JSON 파일로 저장합니다.

        Args:
            video_path (str): 소스 비디오 파일의 경로.
            output_path (str): 결과를 저장할 JSON 파일의 경로.
            show_preview (bool): 처리 과정을 비디오 창으로 보여줄지 여부.

        Returns:
            bool: 추출 및 저장 성공 여부.
        
        Raises:
            FileNotFoundError: 비디오 파일이 존재하지 않을 경우.
            Exception: MediaPipe 처리 중 오류 발생 시.
        """
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise FileNotFoundError(f"비디오 파일을 열 수 없습니다: {video_path}")

            frame_rate = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            all_landmarks = []
            frame_index = 0

            print(f"총 {total_frames} 프레임 처리 시작...")

            while cap.isOpened():
                success, image = cap.read()
                if not success:
                    break

                # 성능 향상을 위해 이미지를 RGB로 변환
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = self.pose.process(image_rgb)

                frame_landmarks = []
                if results.pose_landmarks:
                    for i, landmark in enumerate(results.pose_landmarks.landmark):
                        frame_landmarks.append({
                            "name": self.mp_pose.PoseLandmark(i).name,
                            "x": landmark.x,
                            "y": landmark.y,
                            "z": landmark.z,
                            "visibility": landmark.visibility,
                        })
                    all_landmarks.append({
                        "frame_index": frame_index,
                        "landmarks": frame_landmarks
                    })

                if show_preview:
                    # 원본 이미지에 랜드마크 그리기
                    annotated_image = image.copy()
                    self.mp_drawing.draw_landmarks(
                        annotated_image,
                        results.pose_landmarks,
                        self.mp_pose.POSE_CONNECTIONS)
                    cv2.imshow('MediaPipe Pose', annotated_image)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                
                frame_index += 1
                if frame_index % 30 == 0:
                    print(f"{frame_index}/{total_frames} 프레임 처리 완료...")

            cap.release()
            cv2.destroyAllWindows()

            # 최종 데이터 구조화
            output_data = {
                "video_source": video_path,
                "frame_rate": frame_rate,
                "total_frames": total_frames,
                "pose_landmarks": all_landmarks
            }

            # JSON 파일로 저장
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=4)
            
            print(f"성공적으로 포즈 데이터를 {output_path}에 저장했습니다.")
            return True

        except FileNotFoundError as e:
            print(f"오류: {e}")
            raise
        except Exception as e:
            print(f"포즈 추출 중 오류 발생: {e}")
            cap.release()
            cv2.destroyAllWindows()
            raise

if __name__ == '__main__':
    # 이 스크립트를 직접 실행할 때 테스트를 위한 코드
    
    # 테스트용 비디오 파일 경로
    test_video_path = "sample_video.mp4"
    output_json_path = "pose_output.json"

    extractor = PoseExtractor()
    extractor.extract_from_video(test_video_path, output_json_path, show_preview=False)
