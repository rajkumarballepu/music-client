import React, { useEffect, useRef, useState } from "react";
import {
  IoMdPause,
  IoMdPlay,
  IoMdSkipBackward,
  IoMdSkipForward,
} from "react-icons/io";
import io from "socket.io-client";
import playList from "./PlayList";
import "./Player.css";

export default function Player() {
  const seekBar = useRef(null);
  const volumeRange = useRef(null);
  const [volume, setVolume] = useState(5);
  const [seekTime, setSeekTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioElement = useRef();
  const [currentSong, setCurrentSong] = useState();
  const [tempPlayList, setTempPlayList] = useState();
  const socket = useRef();

  // Use Effects

  useEffect(() => {
    console.log("1 socket connection effect");
    socket.current = io.connect("http://localhost:5000", {
      transports: ["websocket"],
    });
    console.log(socket.current);
    socket.current.emit("joinRoom", { roomId: 30 });
  }, []);

  document.addEventListener("keypress", () => {
    socket.current && socket.current.emit("send", { roomId: 30 });
  });

  useEffect(() => {
    socket.current.on("recieve", (data) => {
      console.log("Clicked.....");
    });
  });

  useEffect(() => {
    socket.current.on("playOnClient", (data) => {
      console.log(data);
      setCurrentSong(data.currentSong);
      setTempPlayList(data.tempPlayList);
      audioElement.current && playSong();
    });
  });

  useEffect(() => {
    socket.current.on("pauseOnClient", (data) => {
      audioElement.current && audioElement.current.pause();
    });
  });

  useEffect(() => {
    setTempPlayList(playList);
    tempPlayList && setCurrentSong(tempPlayList[0]);
  }, [tempPlayList]);

  //Functions

  let handlePlay = (event) => {
    if (!isPlaying) {
      audioElement.current.setAttribute("autoplay", "true");
      playSong();
      socket.current.emit("playSong", {
        roomId: 30,
        tempPlayList: tempPlayList,
        currentSong: currentSong,
      });
    } else {
      audioElement.current.removeAttribute("autoplay");
      socket.current.emit("pauseSong", {
        roomId: 30,
        tempPlayList: tempPlayList,
        currentSong: currentSong,
      });
      audioElement.current.pause();
    }
  };

  async function playSong() {
    if (!isPlaying) {
      return audioElement.current.play();
    }
  }

  const getSongTime = () => {
    let time = parseInt(audioElement.current.currentTime);
    let sec = time % 60;
    let min = parseInt(time / 60);
    min = min > 9 ? min : "0" + min;
    sec = sec > 9 ? sec : "0" + sec;
    return min + " : " + sec;
  };

  const changeSong = async (isNext) => {
    let indexOfCurrentSong = tempPlayList.indexOf(currentSong);
    audioElement.current.autoPlay = true;
    setIsPlaying(false);
    if (isNext) {
      console.log("Next song....");
      indexOfCurrentSong === tempPlayList.length - 1
        ? setCurrentSong(tempPlayList[0])
        : setCurrentSong(tempPlayList[indexOfCurrentSong + 1]);
    } else {
      console.log("Previous song...");
      indexOfCurrentSong === 0
        ? setCurrentSong(tempPlayList[tempPlayList.length - 1])
        : setCurrentSong(tempPlayList[indexOfCurrentSong - 1]);
    }
    console.log(audioElement.current.play());
  };

  return (
    <div className="player">
      <div className="album-photo">
        <img src="" alt="album" />
      </div>
      <div className="progress-bar">
        <input
          ref={seekBar}
          type="range"
          onChange={(event) => {
            audioElement.current.currentTime = event.target.value;
            console.log(event.target.value);
            setSeekTime(event.target.value);
          }}
          min={0}
          value={seekTime}
          name=""
          id="progressbar"
        />
      </div>
      <div className="music-controller">
        <button
          className="btn-cntlr"
          onClick={() => {
            changeSong(false);
          }}
        >
          <IoMdSkipBackward />
        </button>
        <button className="btn-cntlr" onClick={handlePlay}>
          {!isPlaying && <IoMdPlay className="play-icons" />}
          {isPlaying && <IoMdPause className="play-icons" />}
        </button>
        <button
          className="btn-cntlr"
          onClick={() => {
            changeSong(true);
          }}
        >
          <IoMdSkipForward />
        </button>
        <div className="volume-seekbar">
          <input
            ref={volumeRange}
            type="range"
            value={volume}
            max={10}
            onChange={(event) => {
              console.log(event.target.value);
              setVolume(event.target.value);
              audioElement.current.volume = event.target.value / 10;
            }}
          />
        </div>
        <div className="time">{audioElement.current && getSongTime()}</div>
      </div>
      <audio
        ref={audioElement}
        onLoadedMetadata={async (event) => {
          seekBar.current.max = audioElement.current.duration;
          console.log(audioElement.current.metaData);
        }}
        onTimeUpdate={(event) => {
          seekBar.current.value = audioElement.current.currentTime;
          setSeekTime(audioElement.current.currentTime);
        }}
        onPlaying={() => {
          console.log("Playing...");
          setIsPlaying(true);
        }}
        onPause={() => {
          console.log("Pause...");
          setIsPlaying(false);
        }}
        onEnded={async () => {
          let indexOfCurrentSong = tempPlayList.indexOf(currentSong);
          indexOfCurrentSong === tempPlayList.length - 1
            ? setCurrentSong(tempPlayList[0])
            : setCurrentSong(tempPlayList[indexOfCurrentSong + 1]);
          console.log("Ended..");
        }}
        controls
        src={currentSong}
      ></audio>
    </div>
  );
}
