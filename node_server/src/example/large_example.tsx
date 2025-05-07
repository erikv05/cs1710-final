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
      <div className="smart-home-system secure-mode">
        <h1>Smart Home System - Secure Night Mode</h1>
        <div className="state-indicators">
          <div>Status: Secure Night Mode Active</div>
          <div>All systems are monitoring for intrusions</div>
        </div>
        <button onClick={() => setIsMotionDetected(true)}>
          Simulate Motion Detection
        </button>
        <button onClick={() => setIsNightMode(false)}>
          Disable Night Mode
        </button>
      </div>
    );
  } 
  // Motion detected during night mode
  else if (isNightMode && isMotionDetected && !isLightOn && isAlarmArmed) {
    return (
      <div className="smart-home-system alert-mode">
        <h1>Smart Home System - ALERT!</h1>
        <div className="alert-banner">
          Motion detected during night hours!
        </div>
        <div className="action-buttons">
          <button onClick={() => {
            setIsAlarmArmed(false);
            setIsLightOn(true);
          }}>
            Disable Alarm (Authorized)
          </button>
          <button onClick={() => {
            setIsMotionDetected(false);
            setIsDoorLocked(true);
          }}>
            Reset Motion Sensor
          </button>
        </div>
      </div>
    );
  }
  // Normal day mode with energy efficiency
  else if (!isNightMode && isEnergyEfficientMode && !isHeaterOn && !isACOn) {
    return (
      <div className="smart-home-system day-efficient-mode">
        <h1>Smart Home System - Energy Efficient Day Mode</h1>
        <div className="state-indicators">
          <div>Lights: {isLightOn ? 'ON' : 'OFF'}</div>
          <div>Door: {isDoorLocked ? 'LOCKED' : 'UNLOCKED'}</div>
          <div>Window: {isWindowOpen ? 'OPEN' : 'CLOSED'}</div>
          <div>Energy Mode: EFFICIENT</div>
        </div>
        <div className="control-panel">
          <button onClick={() => setIsLightOn(!isLightOn)}>
            Toggle Lights
          </button>
          <button onClick={() => setIsDoorLocked(!isDoorLocked)}>
            Toggle Door Lock
          </button>
          <button onClick={() => setIsWindowOpen(!isWindowOpen)}>
            Toggle Windows
          </button>
          <button onClick={() => {
            setIsHeaterOn(true);
            setIsEnergyEfficientMode(false);
          }}>
            Turn On Heater
          </button>
        </div>
      </div>
    );
  }
  // Climate control active
  else if (!isNightMode && (isHeaterOn || isACOn) && !isEnergyEfficientMode) {
    return (
      <div className="smart-home-system climate-mode">
        <h1>Smart Home System - Climate Control Active</h1>
        <div className="state-indicators">
          <div>Heater: {isHeaterOn ? 'ON' : 'OFF'}</div>
          <div>AC: {isACOn ? 'ON' : 'OFF'}</div>
          <div>Window: {isWindowOpen ? 'OPEN' : 'CLOSED'}</div>
          <div>Energy Mode: NORMAL</div>
        </div>
        <div className="climate-controls">
          <button onClick={() => {
            setIsHeaterOn(false);
            setIsACOn(false);
            setIsEnergyEfficientMode(true);
          }}>
            Turn Off Climate Control
          </button>
          <button onClick={() => {
            if (isHeaterOn) {
              setIsHeaterOn(false);
              setIsACOn(true);
            } else {
              setIsACOn(false);
              setIsHeaterOn(true);
            }
          }}>
            Switch to {isHeaterOn ? 'AC' : 'Heater'}
          </button>
          <button onClick={() => setIsWindowOpen(!isWindowOpen)}>
            {isWindowOpen ? 'Close' : 'Open'} Window
          </button>
        </div>
      </div>
    );
  }
  // Entertainment mode
  else if (!isNightMode && isMusicPlaying && !isAlarmArmed) {
    return (
      <div className="smart-home-system entertainment-mode">
        <h1>Smart Home System - Entertainment Mode</h1>
        <div className="state-indicators">
          <div>Music: PLAYING</div>
          <div>Lights: {isLightOn ? 'ON' : 'OFF'}</div>
        </div>
        <div className="entertainment-controls">
          <button onClick={() => setIsMusicPlaying(false)}>
            Stop Music
          </button>
          <button onClick={() => setIsLightOn(!isLightOn)}>
            Toggle Mood Lighting
          </button>
          <button onClick={() => setIsNightMode(true)}>
            Switch to Night Mode
          </button>
        </div>
      </div>
    );
  }
  // Garage open scenario
  else if (isGarageOpen && !isAlarmArmed && !isNightMode) {
    return (
      <div className="smart-home-system garage-open-mode">
        <h1>Smart Home System - Garage Open</h1>
        <div className="state-indicators">
          <div>Garage: OPEN</div>
          <div>Alarm: DISARMED</div>
        </div>
        <div className="action-buttons">
          <button onClick={() => setIsGarageOpen(false)}>
            Close Garage
          </button>
          <button onClick={() => {
            setIsAlarmArmed(true);
            setIsGarageOpen(false);
          }}>
            Secure House
          </button>
        </div>
      </div>
    );
  }
  // Outdoor systems active
  else if (isSprinklerOn && !isWindowOpen && !isNightMode) {
    return (
      <div className="smart-home-system outdoor-mode">
        <h1>Smart Home System - Outdoor Systems Active</h1>
        <div className="state-indicators">
          <div>Sprinklers: ON</div>
          <div>Windows: CLOSED</div>
        </div>
        <div className="outdoor-controls">
          <button onClick={() => setIsSprinklerOn(false)}>
            Turn Off Sprinklers
          </button>
          <button onClick={() => {
            setIsWindowOpen(true);
            setIsSprinklerOn(false);
          }}>
            Open Windows
          </button>
        </div>
      </div>
    );
  }
  // Leaving home sequence
  else if (!isMotionDetected && !isNightMode && !isMusicPlaying) {
    return (
      <div className="smart-home-system away-mode">
        <h1>Smart Home System - Away Mode</h1>
        <div className="state-indicators">
          <div>Motion: NONE</div>
          <div>Door: {isDoorLocked ? 'LOCKED' : 'UNLOCKED'}</div>
          <div>Alarm: {isAlarmArmed ? 'ARMED' : 'DISARMED'}</div>
        </div>
        <div className="away-controls">
          <button onClick={() => {
            setIsDoorLocked(true);
            setIsAlarmArmed(true);
            setIsLightOn(false);
          }}>
            Secure House
          </button>
          <button onClick={() => {
            setIsEnergyEfficientMode(true);
            setIsHeaterOn(false);
            setIsACOn(false);
          }}>
            Energy Saving Mode
          </button>
          <button onClick={() => setIsMotionDetected(true)}>
            Simulate Return Home
          </button>
        </div>
      </div>
    );
  }
  // Default/fallback state
  else if (!isNightMode && isDoorLocked && isAlarmArmed) {
    return (
      <div className="smart-home-system default-mode">
        <h1>Smart Home System - Standard Mode</h1>
        <div className="state-indicators">
          <div>System Ready</div>
          <div>Door: LOCKED</div>
          <div>Alarm: ARMED</div>
        </div>
        <div className="main-controls">
          <button onClick={() => setIsDoorLocked(false)}>
            Unlock Door
          </button>
          <button onClick={() => setIsNightMode(true)}>
            Enable Night Mode
          </button>
          <button onClick={() => setIsMusicPlaying(true)}>
            Start Entertainment
          </button>
          <button onClick={() => setIsGarageOpen(true)}>
            Open Garage
          </button>
        </div>
      </div>
    );
  }
  // Final fallback for any other state combination
  else {
    return (
      <div className="smart-home-system misc-state">
        <h1>Smart Home System - Custom State</h1>
        <div className="state-indicators">
          <div>Lights: {isLightOn ? 'ON' : 'OFF'}</div>
          <div>Door: {isDoorLocked ? 'LOCKED' : 'UNLOCKED'}</div>
          <div>Window: {isWindowOpen ? 'OPEN' : 'CLOSED'}</div>
          <div>Heater: {isHeaterOn ? 'ON' : 'OFF'}</div>
          <div>AC: {isACOn ? 'ON' : 'OFF'}</div>
          <div>Motion: {isMotionDetected ? 'DETECTED' : 'NONE'}</div>
          <div>Night Mode: {isNightMode ? 'ON' : 'OFF'}</div>
          <div>Alarm: {isAlarmArmed ? 'ARMED' : 'DISARMED'}</div>
          <div>Music: {isMusicPlaying ? 'PLAYING' : 'OFF'}</div>
          <div>Garage: {isGarageOpen ? 'OPEN' : 'CLOSED'}</div>
          <div>Sprinkler: {isSprinklerOn ? 'ON' : 'OFF'}</div>
          <div>Energy Mode: {isEnergyEfficientMode ? 'EFFICIENT' : 'NORMAL'}</div>
        </div>
        <div className="reset-controls">
          <button onClick={() => {
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
          }}>
            Reset All Systems
          </button>
        </div>
      </div>
    );
  }
};

export default SmartHomeSystem;
