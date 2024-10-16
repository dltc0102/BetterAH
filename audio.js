class Audio {
    playDingSound() {
        this.sounds.ding.play();
    }

    constructor() {
        this.sounds = {
            ding: new Sound({ source: "ah_bz_filled_sound.ogg"})
        };
    }
}

export default Audio;