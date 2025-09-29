import cv2
import numpy as np

def create_dummy_video(filename: str, width: int, height: int, duration_secs: int, fps: int):
    """지정된 시간과 프레임률로 간단한 더미 비디오를 생성합니다."""
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filename, fourcc, fps, (width, height))

    if not out.isOpened():
        print(f"Error: VideoWriter를 열 수 없습니다. {filename}")
        return

    total_frames = duration_secs * fps
    for i in range(total_frames):
        # 프레임마다 색상이 바뀌는 이미지 생성
        blue = int(255 * (i / total_frames))
        green = int(255 * ((total_frames - i) / total_frames))
        red = int(128 * (1 + np.sin(2 * np.pi * i / total_frames)))
        
        frame = np.full((height, width, 3), (blue, green, red), dtype=np.uint8)
        out.write(frame)

    print(f"성공적으로 더미 비디오를 생성했습니다: {filename}")
    out.release()

if __name__ == '__main__':
    create_dummy_video("sample_video.mp4", 640, 480, 5, 30)
