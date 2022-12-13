import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

const info = <const>{
  name: "html-audio-response",
  parameters: {
    colorOptions: {
      type: ParameterType.COMPLEX,
      pretty_name: "Color palette",
      default: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF"],
      description: "Colors for the Mondrian",
    },
    count: {
      type: ParameterType.INT,
      pretty_name: "Experiment count",
      default: 0,
      description: "Experiment count",
    },
    rectangleCount: {
      type: ParameterType.INT,
      pretty_name: "Rectangle count",
      default: 500,
      description: "Number of rectangles in Mondrian",
    },
    mondrianCount: {
      type: ParameterType.INT,
      pretty_name: "Mondrian number",
      default: 50,
      description: "Number of unique mondrians to create",
    },
    maxOpacityMondrians: {
      type: ParameterType.FLOAT,
      pretty_name: "Mondrian maximum contrast",
      default: 1,
      description: "Maximum contrast value for the Mondrian mask.",
    },
    trialDuration: {
      type: ParameterType.FLOAT,
      pretty_name: "Trial duration",
      default: 0,
      description: "Maximum time duration allowed for response",
    },
    choices: {
      type: ParameterType.KEYCODE,
      pretty_name: "Response choices",
      default: ["d", "k"],
    },
    stimulusBlock: {
      type: ParameterType.KEYCODE,
      pretty_name: "Stimulus Block",
      default: "",
    },
    stimulusVerticalFlip: {
      type: ParameterType.INT,
      pretty_name: "Vertical flip stimulus",
      default: 0,
    },
    stimulusOpacity: {
      type: ParameterType.FLOAT,
      pretty_name: "Stimulus maximum opacity",
      default: 0.5,
    },
    stimulusSide: {
      type: ParameterType.INT,
      default: -1,
      description: "Stimulus side: 1 is right, 0 is left. -1 is random",
    },
    stimulusDelay: {
      type: ParameterType.FLOAT,
      pretty_name: "Within plugin ITI",
      default: 0,
      description: "Duration of ITI reserved for making sure stimulus image is loaded.",
    },
    stimulusDuration: {
      type: ParameterType.FLOAT,
      pretty_name: "Stimulus duration",
      default: 1000,
      description: "",
    },
    maskDuration: {
      type: ParameterType.FLOAT,
      pretty_name: "Mask duration",
      default: 5000,
      description: "",
    },
    stimulusWidth: {
      type: ParameterType.FLOAT,
      default: 61,
      description: "stimulus width constant, multiply by visUnit",
    },
    stimulusHeight: {
      type: ParameterType.FLOAT,
      default: 61,
      description: "stimulus height constant, multiply by visUnit",
    },
    fadeOutTime: {
      type: ParameterType.FLOAT,
      pretty_name: "Fade out time",
      default: 0,
      description: "When to start fading out mask. 0 is never.",
    },
    fadeInTime: {
      type: ParameterType.FLOAT,
      pretty_name: "Fade in time",
      default: 0,
      description: "Duration of stimulus fade in.",
    },
    fixationVisible: {
      type: ParameterType.BOOL,
      default: true,
      description: "Boolean to show fixation",
    },
    rectangleWidth: {
      type: ParameterType.FLOAT,
      default: 6,
      description: "rWidth constant, multiply by visUnit",
    },
    rectangleHeight: {
      type: ParameterType.FLOAT,
      default: 6,
      description: "rHeight constant, multiply by visUnit",
    },
    fixationWidth: {
      type: ParameterType.FLOAT,
      default: 25 / 3,
      description: "fixation length constant, multiply by visUnit",
    },

    mondrianBetweenStimulusCount: {
      type: ParameterType.INT,
      pretty_name: "Mondrians Between Stimuli",
      default: 1,
      description: "Number of mondrians presented between each stimulus presentation",
    },

    fixationHeight: {
      type: ParameterType.FLOAT,
      default: 2.34,
      description: "fixation height constant, multiply by visUnit",
    },

    frameWidth: {
      type: ParameterType.FLOAT,
      default: 150,
      description: "frame width constant, multiply by visUnit",
    },
    frameHeight: {
      type: ParameterType.FLOAT,
      default: 63,
      description: "frame height constant, multiply by visUnit",
    },
    Hz: {
      type: ParameterType.FLOAT,
      default: 60,
      description: "stimulus fps",
    },
    backgroundColor: {
      type: ParameterType.KEYCODE,
      default: "darkgray",
      description: "Background color",
    },

    removeMondrianBeforeTime: {
      type: ParameterType.FLOAT,
      default: 0,
      description: "Finish Mondrian n seconds before time",
    },
    stimulusAfterPress: {
      type: ParameterType.FLOAT,
      default: 0,
      description: "Make the stimulus visible for n seconds after press",
    },
    rmsType: {
      type: ParameterType.KEYCODE,
      default: "RMS",
      description: "Could be RMS or some kind of control",
    },
    secondStimulus: {
      type: ParameterType.KEYCODE,
      default: "",
      description: "Second stimulus",
    },
    twoSide: {
      type: ParameterType.BOOL,
      default: false,
      description: "If second stimulus",
    },
  },
};

type Info = typeof info;

/**
 * rms
 * jsPsych plugin for rms experiment
 * @author Nadav Weisler
 * @see {@link https://www.jspsych.org/plugins/rms/ rms plugin documentation on jspsych.org}
 */
class HtmlAudioResponsePlugin implements JsPsychPlugin<Info> {
  static info = info;
  private stimulus_start_time;
  private recorder_start_time;
  private recorder: MediaRecorder;
  private audio_url;
  private response;
  private load_resolver;
  private rt: number = null;
  private start_event_handler;
  private stop_event_handler;
  private data_available_handler;
  private recorded_data_chunks = [];

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    this.recorder = this.jsPsych.pluginAPI.getMicrophoneRecorder();

    this.setupRecordingEvents(display_element, trial);

    this.startRecording();
  }

  private showDisplay(display_element, trial) {
    const ro = new ResizeObserver((entries, observer) => {
      this.stimulus_start_time = performance.now();
      observer.unobserve(display_element);
      //observer.disconnect();
    });

    ro.observe(display_element);

    let html = `<div id="jspsych-html-audio-response-stimulus">${trial.stimulus}</div>`;

    if (trial.show_done_button) {
      html += `<p><button class="jspsych-btn" id="finish-trial">${trial.done_button_label}</button></p>`;
    }

    display_element.innerHTML = html;
  }

  private hideStimulus(display_element: HTMLElement) {
    const el: HTMLElement = display_element.querySelector("#jspsych-html-audio-response-stimulus");
    if (el) {
      el.style.visibility = "hidden";
    }
  }

  private addButtonEvent(display_element, trial) {
    const btn = display_element.querySelector("#finish-trial");
    if (btn) {
      btn.addEventListener("click", () => {
        const end_time = performance.now();
        this.rt = Math.round(end_time - this.stimulus_start_time);
        this.stopRecording().then(() => {
          if (trial.allow_playback) {
            this.showPlaybackControls(display_element, trial);
          } else {
            this.endTrial(display_element, trial);
          }
        });
      });
    }
  }

  private setupRecordingEvents(display_element, trial) {
    this.data_available_handler = (e) => {
      if (e.data.size > 0) {
        this.recorded_data_chunks.push(e.data);
      }
    };

    this.stop_event_handler = () => {
      const data = new Blob(this.recorded_data_chunks, { type: "audio/webm" });
      this.audio_url = URL.createObjectURL(data);
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const base64 = (reader.result as string).split(",")[1];
        this.response = base64;
        this.load_resolver();
      });
      reader.readAsDataURL(data);
    };

    this.start_event_handler = (e) => {
      // resets the recorded data
      this.recorded_data_chunks.length = 0;

      this.recorder_start_time = e.timeStamp;
      this.showDisplay(display_element, trial);
      this.addButtonEvent(display_element, trial);

      // setup timer for hiding the stimulus
      if (trial.stimulus_duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          this.hideStimulus(display_element);
        }, trial.stimulus_duration);
      }

      // setup timer for ending the trial
      if (trial.recording_duration !== null) {
        this.jsPsych.pluginAPI.setTimeout(() => {
          // this check is necessary for cases where the
          // done_button is clicked before the timer expires
          if (this.recorder.state !== "inactive") {
            this.stopRecording().then(() => {
              if (trial.allow_playback) {
                this.showPlaybackControls(display_element, trial);
              } else {
                this.endTrial(display_element, trial);
              }
            });
          }
        }, trial.recording_duration);
      }
    };

    this.recorder.addEventListener("dataavailable", this.data_available_handler);

    this.recorder.addEventListener("stop", this.stop_event_handler);

    this.recorder.addEventListener("start", this.start_event_handler);
  }

  private startRecording() {
    this.recorder.start();
  }

  private stopRecording() {
    this.recorder.stop();
    return new Promise((resolve) => {
      this.load_resolver = resolve;
    });
  }

  private showPlaybackControls(display_element, trial) {
    display_element.innerHTML = `
      <p><audio id="playback" src="${this.audio_url}" controls></audio></p>
      <button id="record-again" class="jspsych-btn">${trial.record_again_button_label}</button>
      <button id="continue" class="jspsych-btn">${trial.accept_button_label}</button>
    `;

    display_element.querySelector("#record-again").addEventListener("click", () => {
      // release object url to save memory
      URL.revokeObjectURL(this.audio_url);
      this.startRecording();
    });
    display_element.querySelector("#continue").addEventListener("click", () => {
      this.endTrial(display_element, trial);
    });

    // const audio = display_element.querySelector('#playback');
    // audio.src =
  }

  private endTrial(display_element, trial) {
    // clear recordering event handler

    this.recorder.removeEventListener("dataavailable", this.data_available_handler);
    this.recorder.removeEventListener("start", this.start_event_handler);
    this.recorder.removeEventListener("stop", this.stop_event_handler);

    // kill any remaining setTimeout handlers
    this.jsPsych.pluginAPI.clearAllTimeouts();

    // gather the data to store for the trial
    var trial_data: any = {
      rt: this.rt,
      stimulus: trial.stimulus,
      response: this.response,
      estimated_stimulus_onset: Math.round(this.stimulus_start_time - this.recorder_start_time),
    };

    if (trial.save_audio_url) {
      trial_data.audio_url = this.audio_url;
    } else {
      URL.revokeObjectURL(this.audio_url);
    }

    // clear the display
    display_element.innerHTML = "";

    // move on to the next trial
    this.jsPsych.finishTrial(trial_data);
  }
}

export default HtmlAudioResponsePlugin;
