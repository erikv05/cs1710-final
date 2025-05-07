import React, { useState } from 'react';

/**
 * SmartHomeSystem component represents a smart home automation system
 * with multiple boolean state variables.
 */
const SmartHomeSystem: React.FC = () => {
  // State variables
  const [isLightOn, setIsLightOn] = useState(false);
  const [isDoorLocked, setIsDoorLocked] = useState(true);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [isHeaterOn, setIsHeaterOn] = useState(false);
  const [isACOn, setIsACOn] = useState(false);
  const [isMotionDetected, setIsMotionDetected] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isAlarmArmed, setIsAlarmArmed] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isSprinklerOn, setIsSprinklerOn] = useState(false);
  const [isEnergyEfficientMode, setIsEnergyEfficientMode] = useState(true);

  // Night mode with alarm armed scenario
  if (isNightMode && isAlarmArmed && !isLightOn && isDoorLocked) {
    return (
      <div className="smart-home-system secure-mode" aria-label="secure-night-mode">
        <h1>Smart Home System - Secure Night Mode</h1>
        <div className="state-indicators" role="status">
          <div>Status: Secure Night Mode Active</div>
          <div aria-label="security-status">All systems are monitoring for intrusions</div>
        </div>
        <button 
          onClick={() => setIsMotionDetected(true)}
          aria-label="simulate-motion"
          data-testid="motion-button"
        >
          Simulate Motion Detection
        </button>
        <button 
          onClick={() => setIsNightMode(false)}
          aria-label="disable-night-mode"
        >
          Disable Night Mode
        </button>
      </div>
    );
  } 
  // Motion detected during night mode
  else if (isNightMode && isMotionDetected && !isLightOn && isAlarmArmed) {
    return (
      <div className="smart-home-system alert-mode" aria-label="alert-mode-container">
        <h1>Smart Home System - ALERT!</h1>
        <div className="alert-banner" role="alert" aria-label="motion-alert">
          Motion detected during night hours!
        </div>
        <div className="action-buttons">
          <button 
            onClick={() => {
              setIsAlarmArmed(false);
              setIsLightOn(true);
            }}
            aria-label="disable-alarm"
            data-testid="disable-alarm-button"
          >
            Disable Alarm (Authorized)
          </button>
          <button 
            onClick={() => {
              setIsMotionDetected(false);
              setIsDoorLocked(true);
            }}
            aria-label="reset-motion-sensor"
          >
            Reset Motion Sensor
          </button>
        </div>
      </div>
    );
  }
  // Normal day mode with energy efficiency
  else if (!isNightMode && isEnergyEfficientMode && !isHeaterOn && !isACOn) {
    let lightsStatus = isLightOn ? "Lights: ON" : "Lights: OFF";
    let doorStatus = isDoorLocked ? "Door: LOCKED" : "Door: UNLOCKED";
    let windowStatus = isWindowOpen ? "Window: OPEN" : "Window: CLOSED";
    
    return (
      <div className="smart-home-system day-efficient-mode" aria-label="energy-efficient-mode">
        <h1>Smart Home System - Energy Efficient Day Mode</h1>
        <div className="state-indicators" role="status">
          <div>{lightsStatus}</div>
          <div>{doorStatus}</div>
          <div>{windowStatus}</div>
          <div aria-label="energy-mode-status">Energy Mode: EFFICIENT</div>
        </div>
        <div className="control-panel" role="group" aria-label="home-controls">
          <button 
            onClick={() => setIsLightOn(!isLightOn)}
            aria-label="toggle-lights"
          >
            Toggle Lights
          </button>
          <button 
            onClick={() => setIsDoorLocked(!isDoorLocked)}
            aria-label="toggle-door-lock"
          >
            Toggle Door Lock
          </button>
          <button 
            onClick={() => setIsWindowOpen(!isWindowOpen)}
            aria-label="toggle-windows"
          >
            Toggle Windows
          </button>
          <button 
            onClick={() => {
              setIsHeaterOn(true);
              setIsEnergyEfficientMode(false);
            }}
            aria-label="turn-on-heater"
            data-testid="heater-button"
          >
            Turn On Heater
          </button>
        </div>
      </div>
    );
  }
  // Climate control active
  else if (!isNightMode && (isHeaterOn || isACOn) && !isEnergyEfficientMode) {
    let heaterStatus = isHeaterOn ? "Heater: ON" : "Heater: OFF";
    let acStatus = isACOn ? "AC: ON" : "AC: OFF";
    let windowStatus = isWindowOpen ? "Window: OPEN" : "Window: CLOSED";
    let switchButtonText = isHeaterOn ? "Switch to AC" : "Switch to Heater";
    let windowButtonText = isWindowOpen ? "Close Window" : "Open Window";
    
    return (
      <div className="smart-home-system climate-mode" aria-label="climate-control-mode">
        <h1>Smart Home System - Climate Control Active</h1>
        <div className="state-indicators" role="status">
          <div>{heaterStatus}</div>
          <div>{acStatus}</div>
          <div>{windowStatus}</div>
          <div aria-label="energy-mode-status">Energy Mode: NORMAL</div>
        </div>
        <div className="climate-controls" role="group" aria-label="climate-controls">
          <button 
            onClick={() => {
              setIsHeaterOn(false);
              setIsACOn(false);
              setIsEnergyEfficientMode(true);
            }}
            aria-label="turn-off-climate-control"
          >
            Turn Off Climate Control
          </button>
          <button 
            onClick={() => {
              if (isHeaterOn) {
                setIsHeaterOn(false);
                setIsACOn(true);
              } else {
                setIsACOn(false);
                setIsHeaterOn(true);
              }
            }}
            aria-label="switch-climate-mode"
            data-testid="switch-climate-button"
          >
            {switchButtonText}
          </button>
          <button 
            onClick={() => setIsWindowOpen(!isWindowOpen)}
            aria-label="toggle-window"
          >
            {windowButtonText}
          </button>
        </div>
      </div>
    );
  }
  // Entertainment mode
  else if (!isNightMode && isMusicPlaying && !isAlarmArmed) {
    let lightsStatus = isLightOn ? "Lights: ON" : "Lights: OFF";
    
    return (
      <div className="smart-home-system entertainment-mode" aria-label="entertainment-mode">
        <h1>Smart Home System - Entertainment Mode</h1>
        <div className="state-indicators" role="status">
          <div aria-label="music-status">Music: PLAYING</div>
          <div>{lightsStatus}</div>
        </div>
        <div className="entertainment-controls" role="group" aria-label="entertainment-controls">
          <button 
            onClick={() => setIsMusicPlaying(false)}
            aria-label="stop-music"
            data-testid="music-stop-button"
          >
            Stop Music
          </button>
          <button 
            onClick={() => setIsLightOn(!isLightOn)}
            aria-label="toggle-mood-lighting"
          >
            Toggle Mood Lighting
          </button>
          <button 
            onClick={() => setIsNightMode(true)}
            aria-label="switch-to-night-mode"
          >
            Switch to Night Mode
          </button>
        </div>
      </div>
    );
  }
  // Garage open scenario
  else if (isGarageOpen && !isAlarmArmed && !isNightMode) {
    return (
      <div className="smart-home-system garage-open-mode" aria-label="garage-open-mode">
        <h1>Smart Home System - Garage Open</h1>
        <div className="state-indicators" role="status">
          <div aria-label="garage-status">Garage: OPEN</div>
          <div>Alarm: DISARMED</div>
        </div>
        <div className="action-buttons">
          <button 
            onClick={() => setIsGarageOpen(false)}
            aria-label="close-garage"
            data-testid="garage-close-button"
          >
            Close Garage
          </button>
          <button 
            onClick={() => {
              setIsAlarmArmed(true);
              setIsGarageOpen(false);
            }}
            aria-label="secure-house"
          >
            Secure House
          </button>
        </div>
      </div>
    );
  }
  // Outdoor systems active
  else if (isSprinklerOn && !isWindowOpen && !isNightMode) {
    return (
      <div className="smart-home-system outdoor-mode" aria-label="outdoor-mode">
        <h1>Smart Home System - Outdoor Systems Active</h1>
        <div className="state-indicators" role="status">
          <div aria-label="sprinkler-status">Sprinklers: ON</div>
          <div>Windows: CLOSED</div>
        </div>
        <div className="outdoor-controls">
          <button 
            onClick={() => setIsSprinklerOn(false)}
            aria-label="turn-off-sprinklers"
            data-testid="sprinkler-button"
          >
            Turn Off Sprinklers
          </button>
          <button 
            onClick={() => {
              setIsWindowOpen(true);
              setIsSprinklerOn(false);
            }}
            aria-label="open-windows"
          >
            Open Windows
          </button>
        </div>
      </div>
    );
  }
  // Leaving home sequence
  else if (!isMotionDetected && !isNightMode && !isMusicPlaying) {
    let doorStatus = isDoorLocked ? "Door: LOCKED" : "Door: UNLOCKED";
    let alarmStatus = isAlarmArmed ? "Alarm: ARMED" : "Alarm: DISARMED";
    
    return (
      <div className="smart-home-system away-mode" aria-label="away-mode">
        <h1>Smart Home System - Away Mode</h1>
        <div className="state-indicators" role="status">
          <div>Motion: NONE</div>
          <div>{doorStatus}</div>
          <div aria-label="alarm-status">{alarmStatus}</div>
        </div>
        <div className="away-controls" role="group" aria-label="away-controls">
          <button 
            onClick={() => {
              setIsDoorLocked(true);
              setIsAlarmArmed(true);
              setIsLightOn(false);
            }}
            aria-label="secure-house"
            data-testid="secure-house-button"
          >
            Secure House
          </button>
          <button 
            onClick={() => {
              setIsEnergyEfficientMode(true);
              setIsHeaterOn(false);
              setIsACOn(false);
            }}
            aria-label="energy-saving-mode"
          >
            Energy Saving Mode
          </button>
          <button 
            onClick={() => setIsMotionDetected(true)}
            aria-label="simulate-return-home"
          >
            Simulate Return Home
          </button>
        </div>
      </div>
    );
  }
  // Default/fallback state
  else if (!isNightMode && isDoorLocked && isAlarmArmed) {
    return (
      <div className="smart-home-system default-mode" aria-label="standard-mode">
        <h1>Smart Home System - Standard Mode</h1>
        <div className="state-indicators" role="status">
          <div aria-label="system-ready">System Ready</div>
          <div>Door: LOCKED</div>
          <div>Alarm: ARMED</div>
        </div>
        <div className="main-controls" role="group" aria-label="main-controls">
          <button 
            onClick={() => setIsDoorLocked(false)}
            aria-label="unlock-door"
            data-testid="door-unlock-button"
          >
            Unlock Door
          </button>
          <button 
            onClick={() => setIsNightMode(true)}
            aria-label="enable-night-mode"
          >
            Enable Night Mode
          </button>
          <button 
            onClick={() => setIsMusicPlaying(true)}
            aria-label="start-entertainment"
          >
            Start Entertainment
          </button>
          <button 
            onClick={() => setIsGarageOpen(true)}
            aria-label="open-garage"
          >
            Open Garage
          </button>
        </div>
      </div>
    );
  }
  // Final fallback for any other state combination
  else {
    let lightsStatus = isLightOn ? "Lights: ON" : "Lights: OFF";
    let doorStatus = isDoorLocked ? "Door: LOCKED" : "Door: UNLOCKED";
    let windowStatus = isWindowOpen ? "Window: OPEN" : "Window: CLOSED";
    let heaterStatus = isHeaterOn ? "Heater: ON" : "Heater: OFF";
    let acStatus = isACOn ? "AC: ON" : "AC: OFF";
    let motionStatus = isMotionDetected ? "Motion: DETECTED" : "Motion: NONE";
    let nightModeStatus = isNightMode ? "Night Mode: ON" : "Night Mode: OFF";
    let alarmStatus = isAlarmArmed ? "Alarm: ARMED" : "Alarm: DISARMED";
    let musicStatus = isMusicPlaying ? "Music: PLAYING" : "Music: OFF";
    let garageStatus = isGarageOpen ? "Garage: OPEN" : "Garage: CLOSED";
    let sprinklerStatus = isSprinklerOn ? "Sprinkler: ON" : "Sprinkler: OFF";
    let energyModeStatus = isEnergyEfficientMode ? "Energy Mode: EFFICIENT" : "Energy Mode: NORMAL";
    
    return (
      <div className="smart-home-system misc-state" aria-label="custom-state">
        <h1>Smart Home System - Custom State</h1>
        <div className="state-indicators" role="status">
          <div>{lightsStatus}</div>
          <div>{doorStatus}</div>
          <div>{windowStatus}</div>
          <div>{heaterStatus}</div>
          <div>{acStatus}</div>
          <div>{motionStatus}</div>
          <div>{nightModeStatus}</div>
          <div>{alarmStatus}</div>
          <div>{musicStatus}</div>
          <div>{garageStatus}</div>
          <div>{sprinklerStatus}</div>
          <div>{energyModeStatus}</div>
        </div>
        <div className="reset-controls">
          <button 
            onClick={() => {
              setIsLightOn(false);
              setIsDoorLocked(true);
              setIsWindowOpen(false);
              setIsHeaterOn(false);
              setIsACOn(false);
              setIsMotionDetected(false);
              setIsNightMode(false);
              setIsAlarmArmed(true);
              setIsMusicPlaying(false);
              setIsGarageOpen(false);
              setIsSprinklerOn(false);
              setIsEnergyEfficientMode(true);
            }}
            aria-label="reset-all-systems"
            data-testid="reset-button"
          >
            Reset All Systems
          </button>
        </div>
      </div>
    );
  }
};

export default SmartHomeSystem;
