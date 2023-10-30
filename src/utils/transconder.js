import {fetchFile} from "@ffmpeg/ffmpeg";

const transcode = async(ffmpeg, file, i, type) => {
    switch (type) {
        case "video":
            ffmpeg.FS('writeFile', `${i}.mp4`, await fetchFile(file));
            await ffmpeg.run('-i', `${i}.mp4`, `${file.name}`);
            const video_data = ffmpeg.FS('readFile', `${file.name}`);
            ffmpeg.FS('unlink', `${file.name}`);
            return new File([video_data.buffer], `${file.name}`, {type: "video/mp4"});

        case "image":
            ffmpeg.FS('writeFile', `${i}.jpg`, await fetchFile(file));
            await ffmpeg.run('-i', `${i}.jpg`, "-vf", "scale=600:600", `${file.name}`);
            const image_data = ffmpeg.FS('readFile', `${file.name}`);
            ffmpeg.FS('unlink', `${file.name}`);
            return new File([image_data.buffer], `${file.name}`, {type: "image/jpg"});

        default:
            ffmpeg.FS('writeFile', `${i}.mp3`, await fetchFile(file));
            await ffmpeg.run('-i', `${i}.mp3`, `${file.name}`);
            const audio_data = ffmpeg.FS('readFile', `${file.name}`);
            ffmpeg.FS('unlink', `${file.name}`);
            return new File([audio_data.buffer], `${file.name}`, {type: "audio/mpeg"});
    }
};

export default transcode;
