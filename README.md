# Novation Launchpad X MIDI Sequencer for Raspberry Pi Zero W

A standalone, low-latency hardware MIDI step sequencer running on a Raspberry Pi Zero W, controlled via a Novation Launchpad X in Programmer Mode, accompanied by an authentic browser-based digital twin web interface with polyphonic Web Audio synthesis, Web MIDI hardware routing, and Ableton Link synchronization.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Hardware Requirements & Topology](#hardware-requirements--topology)
3. [Raspberry Pi OS Installation & Preparation](#raspberry-pi-os-installation--preparation)
4. [Phase 1: Linux ConfigFS USB MIDI Gadget Setup](#phase-1-linux-configfs-usb-midi-gadget-setup)
5. [Phase 2: Python Environment & Dependencies](#phase-2-python-environment--dependencies)
6. [Phase 3: Hardware Verification & Programmer Mode Test](#phase-3-hardware-verification--programmer-mode-test)
7. [Phase 4: Running the Core Sequencer Daemon](#phase-4-running-the-core-sequencer-daemon)
8. [Phase 5: Web UI & Embedded Management Server](#phase-5-web-ui--embedded-management-server)
9. [Phase 6: Ableton Link Synchronization](#phase-6-ableton-link-synchronization)
10. [Local PC Testing Guide (macOS, Windows, Linux)](#local-pc-testing-guide-macos-windows-linux)
11. [Automating Boot with Systemd Services](#automating-boot-with-systemd-services)
12. [Troubleshooting & Pro-Tips](#troubleshooting--pro-tips)
13. [Hosting on GitHub Pages](#hosting-on-github-pages)
14. [Building & Releasing Linux AppImage](#building--releasing-linux-appimage)

---

## System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         Raspberry Pi Zero W                            │
 │                                                                        │
 │  ┌───────────────────────┐             ┌─────────────────────────────┐ │
 │  │   Launchpad X Driver  │             │   Core Sequencer Engine     │ │
 │  │   - Programmer Mode   │ ◄─────────► │   - 8 Polyphonic Tracks     │ │
 │  │   - 8x8 RGB LED Map   │   Events    │   - High-Res Drift Clock    │ │
 │  │   - Pressure / Pads   │             │   - Step / Pitch / Velocity │ │
 │  └───────────▲───────────┘             └──────────────▲──────────────┘ │
 │              │ MIDI I/O                               │ Audio/Clock    │
 │              ▼                                        ▼                │
 │  ┌───────────────────────┐             ┌─────────────────────────────┐ │
 │  │ Hardware Interface    │             │ Linux ConfigFS USB Gadget   │ │
 │  │ (USB Host / TRS MIDI) │             │ (/dev/snd/midiC1D0)         │ │
 │  └───────────────────────┘             └──────────────▲──────────────┘ │
 │                                                       │ USB OTG Cable  │
 │  ┌───────────────────────────────────────────┐        │ (Class-Compl.) │
 │  │ aiohttp Real-Time Web Server & WebSocket  │        ▼                │
 │  │ - Launchpad X Virtual Replica Web UI      │ ┌─────────────┐         │
 │  │ - Remote Config / Pattern Storage         │ │ Host PC/DAW │         │
 │  └───────────────────────────────────────────┘ └─────────────┘         │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## Hardware Requirements & Topology

### Required Hardware
- **Raspberry Pi Zero W** (or Zero 2 W) with Raspberry Pi OS (Lite or Desktop, 32-bit or 64-bit).
- **Novation Launchpad X** USB grid controller.
- MicroSD card (16 GB or higher, Class 10 / A1).
- Micro-USB to USB-A OTG adapter cable.
- Standard Micro-USB to USB data cable for connecting the Pi to your PC/DAW.
- High-quality 5V / 2.5A power supply.

### USB Wiring Topologies

The Raspberry Pi Zero W has two micro-USB ports:
- **PWR IN:** Power only.
- **USB:** Data OTG port (can act as Host or Peripheral Gadget).

Choose one of two wiring configurations:

#### Option A: Direct USB Gadget to PC + Launchpad X via TRS MIDI (Recommended for DAWs)
1. The Pi Zero W OTG data port connects directly to your PC/Mac/Linux workstation via a micro-USB cable. The Pi boots as a **class-compliant USB MIDI Gadget** named `"Pi Zero MIDI Sequencer"`.
2. Connect the Launchpad X's 3.5mm TRS Type-A MIDI Out/In port to the Pi's GPIO UART pins (GPIO 14 TXD and GPIO 15 RXD) using a standard 3.3V optocoupled MIDI interface circuit.

#### Option B: USB Host with Micro-USB Hub (Standalone Hardware Sequencer)
1. Connect a powered Micro-USB OTG hub to the Pi's data port.
2. Plug the Launchpad X into the USB hub.
3. The Pi Zero W acts as the USB Host, running the internal sequencer and transmitting MIDI over network (RTP-MIDI / Wi-Fi) or hardware DIN/TRS breakout.

---

## Raspberry Pi OS Installation & Preparation

1. Flash **Raspberry Pi OS Lite (64-bit or 32-bit)** to your microSD card using the [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. In the Imager settings gear icon:
   - Configure hostname (e.g. `pizero-sequencer`).
   - Enable SSH (with public key or password).
   - Configure local Wi-Fi credentials.
3. Insert the card into your Pi Zero W and power on.
4. SSH into the Pi from your terminal:
   ```bash
   ssh pi@pizero-sequencer.local
   ```
5. Update system packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## Phase 1: Linux ConfigFS USB MIDI Gadget Setup

Enable the `dwc2` USB driver and `libcomposite` kernel modules to allow the Raspberry Pi Zero W to emulate a class-compliant USB MIDI interface:

### 1. Enable Kernel Drivers
```bash
# Add dwc2 overlay to boot configuration
sudo tee -a /boot/firmware/config.txt << 'EOF'
[all]
dtoverlay=dwc2
EOF

# If using older Raspberry Pi OS (Bullseye), use /boot/config.txt instead:
# sudo tee -a /boot/config.txt << 'EOF'
# dtoverlay=dwc2
# EOF

# Append required modules to /etc/modules
sudo tee -a /etc/modules << 'EOF'
dwc2
libcomposite
EOF
```

### 2. Create the ConfigFS Gadget Script
Save the initialization script to `/usr/local/bin/setup-midi-gadget.sh`:

```bash
sudo tee /usr/local/bin/setup-midi-gadget.sh << 'EOF'
#!/bin/bash
set -e

CONFIGFS_DIR="/sys/kernel/config/usb_gadget/midi_sequencer"

if [ ! -d "/sys/kernel/config/usb_gadget" ]; then
    modprobe libcomposite
    mount -t configfs none /sys/kernel/config
fi

if [ -d "$CONFIGFS_DIR" ]; then
    echo "USB MIDI Gadget already configured."
    exit 0
fi

mkdir -p "$CONFIGFS_DIR"
cd "$CONFIGFS_DIR"

# Device Identifiers (Class-compliant USB MIDI)
echo 0x1d6b > idVendor  # Linux Foundation
echo 0x0105 > idProduct # Multifunction MIDI Gadget
echo 0x0200 > bcdUSB    # USB 2.0
echo 0x0100 > bcdDevice # Release 1.0.0

# Device Strings
mkdir -p strings/0x409
echo "PI0W-SEQ-001"            > strings/0x409/serialnumber
echo "Custom Embedded Audio"   > strings/0x409/manufacturer
echo "Pi Zero MIDI Sequencer"  > strings/0x409/product

# Configuration
mkdir -p configs/c.1/strings/0x409
echo "MIDI Configuration" > configs/c.1/strings/0x409/configuration
echo 250                  > configs/c.1/MaxPower # 250mA draw limit

# MIDI Function Definition
mkdir -p functions/midi.usb0
echo "PiMidi" > functions/midi.usb0/id
echo 1        > functions/midi.usb0/in_ports
echo 1        > functions/midi.usb0/out_ports
echo 1        > functions/midi.usb0/index

# Bind function to configuration
ln -s functions/midi.usb0 configs/c.1/

# Attach to USB Device Controller (UDC)
UDC_NAME=$(ls /sys/class/udc | head -n 1)
echo "$UDC_NAME" > UDC

echo "USB MIDI Gadget initialized successfully on $UDC_NAME"
EOF

sudo chmod +x /usr/local/bin/setup-midi-gadget.sh
```

Run the script manually to test:
```bash
sudo /usr/local/bin/setup-midi-gadget.sh
```
Verify ALSA created the device:
```bash
aconnect -l
# Expected output contains: "client ... 'f_midi' [type=kernel]"
```

---

## Phase 2: Python Environment & Dependencies

Install the required ALSA and audio libraries:

```bash
sudo apt install -y python3-pip python3-dev libasound2-dev libjack-jackd2-dev git
```

Install Python packages:
```bash
pip3 install --upgrade pip
pip3 install mido python-rtmidi aiohttp
```

*(Optional for native Ableton Link)*:
```bash
pip3 install pylink2 linkaudio
```

---

## Phase 3: Hardware Verification & Programmer Mode Test

Create a directory for your project:
```bash
mkdir -p ~/sequencer && cd ~/sequencer
```

Create `test_hardware.py`:
```bash
nano test_hardware.py
```
Paste the following test script:

```python
#!/usr/bin/env python3
import time
import sys
import mido

# Novation Launchpad X Official DAW Mode Handshake SysEx:
# Step 1: Set DAW Mode ON (F0 00 20 29 02 0C 10 01 F7)
SYSEX_ENTER_DAW_MODE   = [0x00, 0x20, 0x29, 0x02, 0x0C, 0x10, 0x01]
# Step 2: Select Programmer Mode (F0 00 20 29 02 0C 0E 01 F7)
SYSEX_ENTER_PROGRAMMER = [0x00, 0x20, 0x29, 0x02, 0x0C, 0x0E, 0x01]
# Step 3: Set Programmer Layout (F0 00 20 29 02 0C 00 7F F7)
SYSEX_PROGRAMMER_LAYOUT = [0x00, 0x20, 0x29, 0x02, 0x0C, 0x00, 0x7F]
SYSEX_EXIT_DAW_MODE    = [0x00, 0x20, 0x29, 0x02, 0x0C, 0x10, 0x00]

COLOR_GREEN = 21
COLOR_CYAN  = 37
COLOR_OFF   = 0

def find_ports():
    inputs = mido.get_input_names()
    outputs = mido.get_output_names()
    print("Detected Inputs: ", inputs)
    print("Detected Outputs:", outputs)
    
    # Crucial: Target Launchpad X Port 2 (DAW Port) for DAW/Programmer mode SysEx!
    lpx_in = next((p for p in inputs if "Launchpad" in p and ("DAW" in p or "MIDI 2" in p or "2" in p)), None)
    if not lpx_in:
        lpx_in = next((p for p in inputs if "Launchpad" in p), None)

    lpx_out = next((p for p in outputs if "Launchpad" in p and ("DAW" in p or "MIDI 2" in p or "2" in p)), None)
    if not lpx_out:
        lpx_out = next((p for p in outputs if "Launchpad" in p), None)

    gad_out = next((p for p in outputs if "f_midi" in p or "PiMidi" in p), None)
    return lpx_in, lpx_out, gad_out

def main():
    lpx_in_name, lpx_out_name, gad_out_name = find_ports()
    if not lpx_in_name or not lpx_out_name:
        print("[!] Error: Launchpad X not found. Check physical USB connection.")
        sys.exit(1)

    print(f"Connecting to Launchpad X on: IN='{lpx_in_name}', OUT='{lpx_out_name}'")

    with mido.open_output(lpx_out_name) as lpx_out, \
         mido.open_input(lpx_in_name) as lpx_in:

        # 1. Send DAW Mode ON handshake
        lpx_out.send(mido.Message('sysex', data=SYSEX_ENTER_DAW_MODE))
        time.sleep(0.04)
        print("✓ Sent SysEx (10 01): Launchpad X switched to DAW Mode!")

        # 2. Select Programmer Mode & Layout
        lpx_out.send(mido.Message('sysex', data=SYSEX_ENTER_PROGRAMMER))
        time.sleep(0.04)
        lpx_out.send(mido.Message('sysex', data=SYSEX_PROGRAMMER_LAYOUT))
        time.sleep(0.04)
        print("✓ Sent SysEx (0E 01 & 00 7F): Programmer Mode layout activated!")

        # 2. Sweep LED diagnostic
        for row in range(1, 9):
            for col in range(1, 9):
                pad = (row * 10) + col
                lpx_out.send(mido.Message('note_on', note=pad, velocity=COLOR_CYAN))
                time.sleep(0.004)
        time.sleep(0.1)
        for row in range(1, 9):
            for col in range(1, 9):
                pad = (row * 10) + col
                lpx_out.send(mido.Message('note_on', note=pad, velocity=COLOR_OFF))

        gad_out = mido.open_output(gad_out_name) if gad_out_name else None
        print("✓ Listening for pad presses. Press any pad (Ctrl+C to exit)...")

        try:
            for msg in lpx_in:
                if msg.type == 'note_on' and msg.velocity > 0:
                    lpx_out.send(mido.Message('note_on', note=msg.note, velocity=COLOR_GREEN))
                    print(f"Pad Pressed  -> Note {msg.note}")
                    if gad_out: gad_out.send(msg)
                elif msg.type in ('note_off', 'note_on') and getattr(msg, 'velocity', 0) == 0:
                    lpx_out.send(mido.Message('note_on', note=msg.note, velocity=COLOR_OFF))
                    if gad_out: gad_out.send(msg)
        except KeyboardInterrupt:
            lpx_out.send(mido.Message('sysex', data=SYSEX_EXIT_PROGRAMMER))
            print("\nReset Launchpad X to default mode.")

if __name__ == '__main__':
    main()
```

Run the diagnostic:
```bash
python3 test_hardware.py
```
*Your Launchpad X pads should flash cyan, switch to Programmer Mode, and light up green when pressed.*

---

## Phase 4: Running the Core Sequencer Daemon

Save the complete sequencer engine as `engine.py`:

```bash
nano engine.py
```

```python
#!/usr/bin/env python3
import time
import threading
from dataclasses import dataclass, field
from typing import List, Optional
import mido

PALETTE = {
    'OFF': 0, 'RED_DIM': 7, 'RED_BRIGHT': 5,
    'AMBER_DIM': 11, 'AMBER_BRIGHT': 9,
    'YELLOW_DIM': 15, 'YELLOW_BRIGHT': 13,
    'LIME_DIM': 19, 'LIME_BRIGHT': 17,
    'GREEN_DIM': 23, 'GREEN_BRIGHT': 21,
    'CYAN_DIM': 39, 'CYAN_BRIGHT': 37,
    'BLUE_DIM': 47, 'BLUE_BRIGHT': 45,
    'PURPLE_DIM': 51, 'PURPLE_BRIGHT': 49,
    'WHITE': 3, 'PLAYHEAD': 119
}

TRACK_COLORS = [
    (PALETTE['RED_DIM'], PALETTE['RED_BRIGHT']),
    (PALETTE['AMBER_DIM'], PALETTE['AMBER_BRIGHT']),
    (PALETTE['YELLOW_DIM'], PALETTE['YELLOW_BRIGHT']),
    (PALETTE['LIME_DIM'], PALETTE['LIME_BRIGHT']),
    (PALETTE['GREEN_DIM'], PALETTE['GREEN_BRIGHT']),
    (PALETTE['CYAN_DIM'], PALETTE['CYAN_BRIGHT']),
    (PALETTE['BLUE_DIM'], PALETTE['BLUE_BRIGHT']),
    (PALETTE['PURPLE_DIM'], PALETTE['PURPLE_BRIGHT'])
]

@dataclass
class Step:
    active: bool = False
    pitch: int = 60
    velocity: int = 100
    gate: float = 0.5
    probability: float = 1.0

@dataclass
class Track:
    id: int
    name: str
    channel: int = 0
    default_pitch: int = 60
    length: int = 16
    steps: List[Step] = field(default_factory=list)
    mute: bool = False
    solo: bool = False

    def __post_init__(self):
        if not self.steps:
            self.steps = [Step(pitch=self.default_pitch) for _ in range(self.length)]

class SequencerEngine:
    def __init__(self, lpx_out=None, gadget_out=None):
        self.lpx_out = lpx_out
        self.gadget_out = gadget_out
        self.bpm = 124.0
        self.running = False
        self.current_step = 0
        self.active_page = 0
        self.max_steps = 16

        default_pitches = [36, 38, 42, 46, 39, 48, 60, 63]
        self.tracks = [
            Track(id=i, name=f"Track {i+1}", channel=i, default_pitch=default_pitches[i], length=self.max_steps)
            for i in range(8)
        ]
        self._clock_thread = None
        self._lock = threading.Lock()

    def set_bpm(self, bpm: float):
        with self._lock:
            self.bpm = max(20.0, min(300.0, bpm))

    def toggle_step(self, track_idx: int, step_idx: int):
        with self._lock:
            if 0 <= track_idx < 8 and 0 <= step_idx < self.max_steps:
                self.tracks[track_idx].steps[step_idx].active = not self.tracks[track_idx].steps[step_idx].active
        self.render_grid()

    def start(self):
        if self.running: return
        self.running = True
        self._clock_thread = threading.Thread(target=self._run_clock, daemon=True)
        self._clock_thread.start()
        self.update_transport_led()

    def stop(self):
        self.running = False
        self.current_step = 0
        self.update_transport_led()
        self.render_grid()

    def _run_clock(self):
        step_interval = (60.0 / self.bpm) / 4.0
        next_tick = time.perf_counter()

        while self.running:
            now = time.perf_counter()
            if now >= next_tick:
                self._trigger_step(self.current_step)
                self.current_step = (self.current_step + 1) % self.max_steps
                step_interval = (60.0 / self.bpm) / 4.0
                next_tick += step_interval

            sleep_duration = next_tick - time.perf_counter()
            if sleep_duration > 0.002:
                time.sleep(sleep_duration - 0.001)

    def _trigger_step(self, step_idx: int):
        self.render_grid()
        has_solo = any(t.solo for t in self.tracks)

        for track in self.tracks:
            if track.mute or (has_solo and not track.solo):
                continue
            step = track.steps[step_idx % track.length]
            if step.active:
                self._emit_midi_note(track.channel, step.pitch, step.velocity, step.gate)

    def _emit_midi_note(self, channel: int, pitch: int, velocity: int, gate: float):
        if not self.gadget_out: return
        self.gadget_out.send(mido.Message('note_on', channel=channel, note=pitch, velocity=velocity))
        gate_sec = ((60.0 / self.bpm) / 4.0) * gate

        def schedule_off():
            time.sleep(gate_sec)
            if self.gadget_out:
                self.gadget_out.send(mido.Message('note_off', channel=channel, note=pitch, velocity=0))
        threading.Thread(target=schedule_off, daemon=True).start()

    def render_grid(self):
        if not self.lpx_out: return
        offset = self.active_page * 8
        for row_idx in range(8):
            track = self.tracks[row_idx]
            dim_col, bright_col = TRACK_COLORS[row_idx]
            lpx_row = 8 - row_idx
            for col_idx in range(8):
                step_idx = offset + col_idx
                pad = (lpx_row * 10) + (col_idx + 1)
                step = track.steps[step_idx]

                if step_idx == self.current_step and self.running:
                    color = PALETTE['WHITE'] if step.active else PALETTE['PLAYHEAD']
                elif step.active:
                    color = bright_col
                else:
                    color = dim_col
                self.lpx_out.send(mido.Message('note_on', note=pad, velocity=color))

    def update_transport_led(self):
        if not self.lpx_out: return
        color = PALETTE['GREEN_BRIGHT'] if self.running else PALETTE['RED_DIM']
        self.lpx_out.send(mido.Message('control_change', control=98, value=color))
```

---

## Phase 5: Web UI & Embedded Management Server

Run the `aiohttp` web server to manage patterns, control parameters, and preview sequences from your browser:

Save as `server.py`:
```bash
nano server.py
```

```python
#!/usr/bin/env python3
import os
import json
import asyncio
from aiohttp import web
import mido
from engine import SequencerEngine

# Locate MIDI ports
inputs = mido.get_input_names()
outputs = mido.get_output_names()
lpx_in = next((p for p in inputs if "Launchpad" in p), None)
lpx_out = next((p for p in outputs if "Launchpad" in p), None)
gad_out = next((p for p in outputs if "f_midi" in p or "PiMidi" in p), None)

lpx_out_port = mido.open_output(lpx_out) if lpx_out else None
gad_out_port = mido.open_output(gad_out) if gad_out else None

engine = SequencerEngine(lpx_out=lpx_out_port, gadget_out=gad_out_port)

app = web.Application()
sockets = set()

async def handle_index(request):
    return web.FileResponse(os.path.join(os.path.dirname(__file__), 'index.html'))

async def handle_ws(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    sockets.add(ws)

    # Initial state push
    await ws.send_json({'bpm': engine.bpm, 'running': engine.running, 'step': engine.current_step})

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                data = json.loads(msg.data)
                action = data.get('action')
                if action == 'toggle_step':
                    engine.toggle_step(data['track'], data['step'])
                elif action == 'set_bpm':
                    engine.set_bpm(float(data['bpm']))
                elif action == 'transport':
                    engine.start() if data['command'] == 'start' else engine.stop()
    finally:
        sockets.remove(ws)
    return ws

app.router.add_get('/', handle_index)
app.router.add_get('/ws', handle_ws)

if __name__ == '__main__':
    print("Launching Launchpad X Sequencer Web Server on http://0.0.0.0:8080")
    web.run_app(app, host='0.0.0.0', port=8080)
```

Access the Web UI at:
```
http://pizero-sequencer.local:8080
```

---

## Phase 6: Ableton Link Synchronization

Install Ableton Link on your Pi:

```bash
pip3 install pylink2 linkaudio
```

Create `ableton_link_sync.py`:

```python
#!/usr/bin/env python3
import time
import threading

try:
    import link
    LINK_OK = True
except ImportError:
    LINK_OK = False

class AbletonLinkSync:
    def __init__(self, initial_bpm=120.0, quantum=4.0):
        self.quantum = quantum
        self.bpm = initial_bpm
        self.num_peers = 0
        self._link = link.Link(initial_bpm) if LINK_OK else None
        if self._link:
            self._link.enabled = True
            self._link.startStopSyncEnabled = True

    def get_timeline(self):
        if self._link:
            state = self._link.captureAudioSessionState()
            host_time = self._link.clock().micros()
            beat = state.beatAtTime(host_time, self.quantum)
            phase = state.phaseAtTime(host_time, self.quantum)
            return beat, phase, state.tempo(), self._link.numPeers()
        now = time.perf_counter()
        beat = now * (self.bpm / 60.0)
        return beat, beat % self.quantum, self.bpm, 1
```

---

## Local PC Testing Guide (macOS, Windows, Linux)

You can test the entire system on your local desktop computer before flashing or configuring the Raspberry Pi Zero W.

### Method 1: Testing the Interactive Web UI (Instant, No Hardware Needed)

The Web interface contains a complete digital twin of the Launchpad X with an embedded 8-voice Web Audio synthesizer.

1. **Install Node.js**: Ensure Node.js (v18+) is installed on your computer.
2. **Install project dependencies**:
   ```bash
   npm install
   ```
3. **Start the local development server**:
   ```bash
   npm run dev
   ```
4. **Open in a Web MIDI compatible browser**:
   Navigate to `http://localhost:3000` using Google Chrome, Microsoft Edge, Brave, or Opera.
5. **(Optional) Connect physical Launchpad X**:
   - Plug your Novation Launchpad X directly into your PC via USB.
   - When the browser prompts for MIDI permissions, click **Allow**.
   - The app will automatically detect `"Launchpad X LPX MIDI"` or `"MIDIIN2"`, switch it to **Programmer Mode**, and synchronize physical pads with the virtual screen pads in real time!

---

### Method 2: Testing the Python Sequencer on Your PC

You can run the Python sequencer engine on macOS, Windows, or Linux by routing MIDI into a virtual loopback cable connected to your DAW (Ableton Live, FL Studio, Logic Pro, Bitwig):

#### Step 1: Set Up Virtual MIDI Ports on Your PC
- **macOS**:
  1. Open **Audio MIDI Setup** (Cmd+Space -> `Audio MIDI Setup`).
  2. Press `Cmd+2` (or Window -> Show MIDI Studio).
  3. Double-click **IAC Driver**, check the box **"Device is online"**, and ensure at least one port (e.g. `IAC Driver Bus 1`) exists.
- **Windows**:
  1. Download and run [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html) (free).
  2. Click the `+` button to create a virtual port named `loopMIDI Port 1`.
- **Linux**:
  ```bash
  sudo modprobe snd-virmidi
  ```

#### Step 2: Install Python Dependencies on Your PC
```bash
pip install mido python-rtmidi aiohttp
```

#### Step 3: Run the Hardware & Port Test
```bash
python test_hardware.py
```
This lists all detected physical and virtual MIDI ports on your PC.

#### Step 4: Run the Web Server & Python Sequencer
```bash
python server.py
```
Open `http://localhost:8080` in your browser. Any note events fired by the sequencer will stream through your virtual MIDI cable directly into your DAW tracks!

---

## Automating Boot with Systemd Services

Configure the sequencer to start automatically when the Raspberry Pi boots up:

### 1. USB MIDI Gadget Service
```bash
sudo tee /etc/systemd/system/midi-gadget.service << 'EOF'
[Unit]
Description=USB MIDI ConfigFS Gadget Service
After=sys-kernel-config.mount
DefaultDependencies=no

[Service]
Type=oneshot
ExecStart=/usr/local/bin/setup-midi-gadget.sh
RemainAfterExit=yes

[Install]
WantedBy=sysinit.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable midi-gadget.service
```

### 2. Sequencer Engine & Web Server Service
```bash
sudo tee /etc/systemd/system/sequencer.service << 'EOF'
[Unit]
Description=Launchpad X Sequencer Service
After=midi-gadget.service network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/sequencer
ExecStart=/usr/bin/python3 /home/pi/sequencer/server.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable sequencer.service
sudo systemctl start sequencer.service
```

---

## Troubleshooting & Pro-Tips

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Launchpad X pads do not light up** | Device is in normal Session mode | Send SysEx `F0 00 20 29 02 0C 00 0D F7` via `test_hardware.py` to enter Programmer Mode. |
| **PC does not see USB MIDI device** | ConfigFS did not bind to UDC | Verify `ls /sys/class/udc` contains your controller (e.g. `20980000.usb`) and check `sudo dmesg \| grep -i gadget`. |
| **Audio timing jitter or latency** | Python `time.sleep()` OS scheduling drift | Ensure you are using `time.perf_counter()` drift compensation as shown in `engine.py`. |
| **Permission denied on MIDI ports** | User `pi` not in `audio` group | Run `sudo usermod -aG audio pi` and log out/in. |
| **Web MIDI not detecting Launchpad in browser** | HTTPS or browser permission restriction | Open the Web UI via `http://localhost:3000` or enable Web MIDI in `chrome://flags`. |

---

## Hosting on GitHub Pages

Yes! The Web UI is a 100% client-side application built with React, Vite, and TypeScript. All audio synthesis and MIDI communication run locally inside the user's browser using standard Web Audio and Web MIDI APIs. Because GitHub Pages serves sites over HTTPS with free SSL, Web MIDI permissions work seamlessly.

The repository includes a ready-to-run GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) that automatically builds and deploys the site whenever changes are pushed to `main` (or `master`).

### How to Enable GitHub Pages in 3 Steps:

1. **Push your repository to GitHub**:
   ```bash
   git add .
   git commit -m "feat: Add GitHub Pages and AppImage release workflows"
   git push origin main
   ```

2. **Enable GitHub Actions as the Pages Source**:
   - Go to your repository on GitHub.
   - Navigate to **Settings** -> **Pages** (under the "Code and automation" section).
   - Under **Build and deployment** -> **Source**, select **GitHub Actions**.

3. **Automatic Deployment**:
   - The `.github/workflows/deploy-pages.yml` workflow will automatically trigger, build the Vite app with relative asset paths, and publish the live site.
   - Your live web sequencer will be accessible at:
     ```
     https://<your-username>.github.io/<your-repo-name>/
     ```
   - You can also manually trigger a redeployment anytime under the **Actions** tab by selecting **Deploy to GitHub Pages** and clicking **Run workflow**.

---

## Building & Releasing Linux AppImage

An **AppImage** is a portable, standalone Linux executable format that runs on virtually any modern Linux distribution (Ubuntu, Debian, Pop!_OS, Arch, Fedora, openSUSE, etc.) without requiring installation or root permissions.

This project packages the entire web sequencer with an Electron runtime optimized for low-latency audio, real-time ALSA/PipeWire MIDI, and automatic SysEx permissions.

### Option 1: Automatic Release via GitHub Actions (Recommended)

The repository includes a production-grade release workflow at `.github/workflows/release-appimage.yml`.

#### Method A: Push a Version Tag
Whenever you tag a release and push it to GitHub, the workflow automatically builds the AppImage and attaches it to a new GitHub Release with SHA256 checksums:

```bash
# Tag a new release:
git tag v1.0.0
# Push the tag to GitHub:
git push origin v1.0.0
```
- The action will build `Launchpad-X-Sequencer-1.0.0.AppImage`.
- It calculates cryptographic hashes (`SHA256SUMS.txt`).
- It creates a GitHub Release with full release notes and direct download links!

#### Method B: Trigger Manually via GitHub UI
You can build and test an AppImage anytime directly from GitHub:
1. Go to your repository on GitHub and click the **Actions** tab.
2. In the left sidebar, click **Build & Release Linux AppImage**.
3. Click **Run workflow**, choose your branch (e.g. `main`), and click **Run workflow**.
4. When the run finishes, the `.AppImage` file is immediately downloadable from the **Artifacts** section at the bottom of the workflow summary page!

---

### Option 2: Building the AppImage Locally on Linux

If you are on your local Linux PC (e.g. Pop!_OS / Ubuntu), you can build the AppImage locally in seconds:

1. **Install dependencies**:
   ```bash
   # Use --legacy-peer-deps to avoid upstream peer conflicts
   npm install --legacy-peer-deps
   ```

2. **Build the AppImage**:
   ```bash
   npm run build:appimage
   ```
   *(Or run `npx electron-builder --linux AppImage`)*

3. **Run your AppImage**:
   The output executable is created in the `release-dist/` folder:
   ```bash
   # Give execute permissions:
   chmod +x release-dist/*.AppImage

   # Launch the desktop sequencer:
   ./release-dist/Launchpad-X-Sequencer-*.AppImage
   ```

### Linux Web MIDI & USB Permissions (udev rules)
To ensure the Launchpad X can be opened in raw SysEx mode on Linux without root privileges:
```bash
# Add current user to the audio group:
sudo usermod -aG audio $USER

# (Optional) Add udev rule for Novation USB devices:
sudo tee /etc/udev/rules.d/99-novation.rules << 'EOF'
SUBSYSTEM=="usb", ATTR{idVendor}=="1235", MODE="0666"
SUBSYSTEM=="sound", GROUP="audio", MODE="0660"
EOF

sudo udevadm control --reload-rules && sudo udevadm trigger
```
Log out and back in for group changes to take effect.

