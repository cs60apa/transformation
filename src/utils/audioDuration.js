import moment from "moment";

const audioDuration = (file) => {
    return new Promise((resolve) => {
        let objectURL = URL.createObjectURL(file);
        let audio = new Audio([objectURL]);
        audio.addEventListener(
            "canplaythrough",
            () => {
                URL.revokeObjectURL(objectURL);
                let seconds = audio.duration;
                let duration = moment.duration(seconds, "seconds");

                let time = "";
                let hours = duration.hours();
                if (hours > 0) { time = hours + ":" ; }

                time = time + duration.minutes() + ":" + duration.seconds();
                resolve({
                    duration: time
                });
            },
            false,
        );
    });
}

export default audioDuration;
