import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateManual() {
  const doc = await PDFDocument.create();

  // Color definitions (RGB 0.0 - 1.0)
  const darkBg = rgb(0.06, 0.07, 0.09);
  const cardBg = rgb(0.09, 0.11, 0.14);
  const cardBorder = rgb(0.18, 0.22, 0.28);
  const textWhite = rgb(0.96, 0.97, 0.98);
  const textGray = rgb(0.68, 0.72, 0.78);
  const textDim = rgb(0.48, 0.52, 0.58);
  const cyan = rgb(0.0, 0.9, 1.0);
  const purple = rgb(0.83, 0.2, 0.98);
  const amber = rgb(1.0, 0.57, 0.0);
  const green = rgb(0.0, 0.9, 0.46);
  const red = rgb(1.0, 0.2, 0.27);
  const yellow = rgb(1.0, 0.82, 0.0);

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontMono = await doc.embedFont(StandardFonts.Courier);
  const fontMonoBold = await doc.embedFont(StandardFonts.CourierBold);

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89; // A4

  function createPageWithHeader(title, subtitle, pageNum, totalPages) {
    const page = doc.addPage([pageWidth, pageHeight]);
    
    // Background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: darkBg,
    });

    // Top Header Banner
    page.drawRectangle({
      x: 36,
      y: pageHeight - 56,
      width: pageWidth - 72,
      height: 32,
      color: cardBg,
      borderColor: cardBorder,
      borderWidth: 1,
    });

    page.drawText('NOVATION LAUNCHPAD X | MIDI SEQUENCER STUDIO', {
      x: 48,
      y: pageHeight - 44,
      size: 9,
      font: fontBold,
      color: cyan,
    });

    page.drawText(`PAGE ${pageNum} OF ${totalPages}`, {
      x: pageWidth - 140,
      y: pageHeight - 44,
      size: 8,
      font: fontMonoBold,
      color: textDim,
    });

    // Page Title
    page.drawText(title.toUpperCase(), {
      x: 36,
      y: pageHeight - 84,
      size: 16,
      font: fontBold,
      color: textWhite,
    });

    if (subtitle) {
      page.drawText(subtitle, {
        x: 36,
        y: pageHeight - 100,
        size: 9.5,
        font: fontRegular,
        color: textGray,
      });
    }

    // Divider Line
    page.drawLine({
      start: { x: 36, y: pageHeight - 110 },
      end: { x: pageWidth - 36, y: pageHeight - 110 },
      thickness: 1,
      color: cardBorder,
    });

    return page;
  }

  // ==========================================
  // PAGE 1: OVERVIEW & TOP CONTROLS (CC 91-98)
  // ==========================================
  const page1 = createPageWithHeader('1. Overview & Top Hardware Controls', 'Launchpad X hardware layout, CC functions, and SysEx mode architecture', 1, 4);
  let y = pageHeight - 130;

  // Overview Card
  page1.drawRectangle({
    x: 36,
    y: y - 75,
    width: pageWidth - 72,
    height: 75,
    color: cardBg,
    borderColor: cyan,
    borderWidth: 1,
  });

  page1.drawText('HARDWARE INTEGRATION ARCHITECTURE', {
    x: 48,
    y: y - 20,
    size: 10,
    font: fontBold,
    color: cyan,
  });

  const overviewText = [
    '* Hardware: Novation Launchpad X USB MIDI Controller in bidirectional Programmer / DAW Mode.',
    '* Dual Ports: Live Port 1 (Standard MIDI) and DAW Port 2 (SysEx Handshake & LED RGB Matrix).',
    '* Web MIDI & Standalone: Works seamlessly in Chrome/Edge Web MIDI and headlessly on Raspberry Pi Zero W.',
    '* Zero Feedback Loop: Mode switching uses physical velocity filters (vel=127) and debounced SysEx commands.',
  ];

  overviewText.forEach((line, idx) => {
    page1.drawText(line, {
      x: 48,
      y: y - 36 - idx * 12,
      size: 8.5,
      font: fontRegular,
      color: textGray,
    });
  });

  y -= 95;

  // Section Header: Top Controls
  page1.drawText('TOP ROW CONTROL BUTTONS (CC 91 - CC 98)', {
    x: 36,
    y: y,
    size: 11,
    font: fontBold,
    color: textWhite,
  });

  y -= 15;

  const topControls = [
    {
      cc: 'CC 91',
      name: 'UP ARROW',
      color: amber,
      desc: 'Octave Up / Tempo Up. In Step Sequencer mode, shifts octave of melodic tracks up by +12 semitones or increments BPM by +2.',
      led: 'White glow',
    },
    {
      cc: 'CC 92',
      name: 'DOWN ARROW',
      color: amber,
      desc: 'Octave Down / Tempo Down. Shifts active melodic track pitch down by -12 semitones or decrements BPM by -2.',
      led: 'White glow',
    },
    {
      cc: 'CC 93',
      name: 'LEFT ARROW',
      color: cyan,
      desc: 'Bank 1 / Page 1 Selector. Selects steps 1 through 8 on the 8x8 pad matrix. Lights up bright cyan when Page 1 is active.',
      led: 'Bright Cyan (Active) / Dim Cyan',
    },
    {
      cc: 'CC 94',
      name: 'RIGHT ARROW',
      color: cyan,
      desc: 'Bank 2 / Page 2 Selector. Selects steps 9 through 16 on the 8x8 pad matrix. Lights up bright cyan when Page 2 is active.',
      led: 'Bright Cyan (Active) / Dim Cyan',
    },
    {
      cc: 'CC 95',
      name: 'SESSION / MIXER',
      color: cyan,
      desc: 'Sequencer Session Mode (DAW Programmer Mode). Sends SysEx [F0 00 20 29 02 0C 10 01 F7] and [0E 01 / 00 7F]. Lights up the 8x8 step sequencer grid and enables playhead sweep.',
      led: 'Bright Cyan LED indicator',
    },
    {
      cc: 'CC 96',
      name: 'NOTE MODE',
      color: purple,
      desc: 'Standalone Melodic Note Mode. Releases DAW mode via SysEx [F0 00 20 29 02 0C 10 00 F7] and engages Note layout [00 01]. Launchpad native scale engine, aftertouch, and instrument playing take over.',
      led: 'Bright Magenta/Purple LED indicator',
    },
    {
      cc: 'CC 97',
      name: 'CUSTOM MODE',
      color: amber,
      desc: 'Standalone Custom User Mode. Releases DAW mode and selects Custom 1 Layout [00 04]. Allows mapping custom MIDI CC and Note faders configured via Novation Components.',
      led: 'Bright Amber LED indicator',
    },
    {
      cc: 'CC 98',
      name: 'RECORD / PLAY',
      color: green,
      desc: 'Master Transport Toggle. Starts and stops the polyphonic 16-step sequencer clock, Web Audio synthesizer voices, and external MIDI clock broadcast.',
      led: 'Bright Green (Running) / Dim Red (Stopped)',
    },
  ];

  topControls.forEach((item) => {
    page1.drawRectangle({
      x: 36,
      y: y - 56,
      width: pageWidth - 72,
      height: 52,
      color: cardBg,
      borderColor: cardBorder,
      borderWidth: 1,
    });

    // CC Tag Badge
    page1.drawRectangle({
      x: 44,
      y: y - 26,
      width: 52,
      height: 18,
      color: darkBg,
      borderColor: item.color,
      borderWidth: 1,
    });

    page1.drawText(item.cc, {
      x: 48,
      y: y - 22,
      size: 8.5,
      font: fontMonoBold,
      color: item.color,
    });

    page1.drawText(item.name, {
      x: 104,
      y: y - 22,
      size: 9.5,
      font: fontBold,
      color: textWhite,
    });

    page1.drawText(`LED: ${item.led}`, {
      x: pageWidth - 240,
      y: y - 22,
      size: 8,
      font: fontRegular,
      color: item.color,
    });

    page1.drawText(item.desc, {
      x: 46,
      y: y - 44,
      size: 8,
      font: fontRegular,
      color: textGray,
      maxWidth: pageWidth - 96,
      lineHeight: 10,
    });

    y -= 62;
  });

  // ==========================================
  // PAGE 2: RIGHT-HAND SCENE BUTTONS
  // ==========================================
  const page2 = createPageWithHeader('2. Right-Hand Scene Launch Buttons', 'Authentic hardware scene column functions (Row 8 down to Row 1 / CC 89 - CC 19)', 2, 4);
  y = pageHeight - 130;

  // Scene Intro
  page2.drawRectangle({
    x: 36,
    y: y - 55,
    width: pageWidth - 72,
    height: 55,
    color: cardBg,
    borderColor: cardBorder,
    borderWidth: 1,
  });

  page2.drawText('RIGHT SCENE COLUMN ARCHITECTURE', {
    x: 48,
    y: y - 18,
    size: 9.5,
    font: fontBold,
    color: amber,
  });

  page2.drawText('The 8 circular buttons on the right edge of the Novation Launchpad X transmit Control Change (and Note On in Programmer Mode) on CC 89 down to CC 19. In this sequencer, they provide direct hardware control matching the official silk-screened labels on the real device.', {
    x: 48,
    y: y - 34,
    size: 8.5,
    font: fontRegular,
    color: textGray,
    maxWidth: pageWidth - 96,
    lineHeight: 11,
  });

  y -= 75;

  const sceneButtons = [
    {
      cc: 'CC 89 / Note 89',
      row: 'ROW 8 (TOP RIGHT)',
      name: 'VOLUME',
      color: cyan,
      role: 'Active Track Cycler',
      action: 'Pressing VOLUME cycles through tracks 1 to 8 (Kick -> Snare -> Hat -> Open Hat -> Clap -> Bass -> Lead -> Chord). Instantly focuses the selected track in the Step & Track Inspector decks.',
      ledState: 'Dim Cyan standby glow.',
    },
    {
      cc: 'CC 79 / Note 79',
      row: 'ROW 7',
      name: 'PAN',
      color: cyan,
      role: 'View Mode Switcher',
      action: 'Cycles the active visual workspace between: (1) 8-Track Multi-Track Grid, (2) 64-Step Melodic Single Track, and (3) Euclidean Algorithmic Engine.',
      ledState: 'Dim Cyan / Active mode accent glow.',
    },
    {
      cc: 'CC 69 / Note 69',
      row: 'ROW 6',
      name: 'SEND A',
      color: yellow,
      role: '4-Track Melodic (Inst 1-4)',
      action: 'Switches to 64-step view displaying instruments 1 to 4 (Kick, Snare, Closed Hat, Open Hat) with 16 steps each (2 rows per track). Pressing SEND A again toggles back to 8-track grid.',
      ledState: 'Bright Yellow when Send A mode is active; Dim Yellow when in 8-track grid.',
    },
    {
      cc: 'CC 59 / Note 59',
      row: 'ROW 5',
      name: 'SEND B',
      color: amber,
      role: '4-Track Melodic (Inst 5-8)',
      action: 'Switches to 64-step view displaying instruments 5 to 8 (Clap, Acid Bass, Lead, Chord) with 16 steps each (2 rows per track). Pressing SEND B again toggles back to 8-track grid.',
      ledState: 'Bright Amber/Yellow when Send B mode is active; Dim Yellow when in 8-track grid.',
    },
    {
      cc: 'CC 49 / Note 49',
      row: 'ROW 4',
      name: 'STOP CLIP',
      color: red,
      role: 'Panic & Instant Stop',
      action: 'Emergency all-notes-off and transport halt. Instantly cuts audio synthesis, releases MIDI note-ons, and clears any stuck active voices.',
      ledState: 'Bright Amber when sequencer is running (armed to stop); Dark Gray when stopped.',
    },
    {
      cc: 'CC 39 / Note 39',
      row: 'ROW 3',
      name: 'MUTE',
      color: red,
      role: 'Track Mute Toggle',
      action: 'Toggles Mute on the currently selected active track. Muted tracks stop producing sound and external MIDI while keeping pattern data intact.',
      ledState: 'Bright Red if active track is muted; Dim Red if any other track is muted; Dark Gray when no tracks are muted.',
    },
    {
      cc: 'CC 29 / Note 29',
      row: 'ROW 2',
      name: 'SOLO',
      color: green,
      role: 'Track Solo Toggle',
      action: 'Toggles Solo on the currently selected active track. When one or more tracks are soloed, only soloed tracks are audible.',
      ledState: 'Bright Green if active track is soloed; Dim Green if other tracks are soloed; Dark Gray when no tracks are soloed.',
    },
    {
      cc: 'CC 19 / Note 19',
      row: 'ROW 1 (BOTTOM RIGHT)',
      name: 'RECORD ARM',
      color: red,
      role: 'Master Transport Play / Stop',
      action: 'Hardware transport play/stop trigger. Starts the 16th note clock, Ableton Link synchronization, and playhead sweep.',
      ledState: 'Bright Red pulse when running; Dim Red when stopped.',
    },
  ];

  sceneButtons.forEach((btn) => {
    page2.drawRectangle({
      x: 36,
      y: y - 66,
      width: pageWidth - 72,
      height: 62,
      color: cardBg,
      borderColor: cardBorder,
      borderWidth: 1,
    });

    page2.drawRectangle({
      x: 44,
      y: y - 28,
      width: 78,
      height: 18,
      color: darkBg,
      borderColor: btn.color,
      borderWidth: 1,
    });

    page2.drawText(btn.name, {
      x: 48,
      y: y - 23,
      size: 9,
      font: fontBold,
      color: btn.color,
    });

    page2.drawText(`${btn.row} | ${btn.cc}`, {
      x: 130,
      y: y - 23,
      size: 8,
      font: fontMono,
      color: textDim,
    });

    page2.drawText(`ROLE: ${btn.role.toUpperCase()}`, {
      x: pageWidth - 210,
      y: y - 23,
      size: 8,
      font: fontBold,
      color: textWhite,
    });

    page2.drawText(`* Action: ${btn.action}`, {
      x: 46,
      y: y - 42,
      size: 8,
      font: fontRegular,
      color: textGray,
      maxWidth: pageWidth - 96,
      lineHeight: 10,
    });

    page2.drawText(`* LED Feedback: ${btn.ledState}`, {
      x: 46,
      y: y - 56,
      size: 7.5,
      font: fontRegular,
      color: btn.color,
    });

    y -= 72;
  });

  // ==========================================
  // PAGE 3: 8x8 GRID, MODES & ROW COLORS
  // ==========================================
  const page3 = createPageWithHeader('3. 8x8 Pad Matrix, Modes & Row Colors', 'Polyphonic sequencing, melodic modes, and RGB palette customization', 3, 4);
  y = pageHeight - 130;

  // 8x8 Matrix Overview
  page3.drawText('THE 8x8 SILICONE PAD MATRIX (NOTES 11 - 88)', {
    x: 36,
    y: y,
    size: 11,
    font: fontBold,
    color: textWhite,
  });

  y -= 15;

  page3.drawRectangle({
    x: 36,
    y: y - 95,
    width: pageWidth - 72,
    height: 95,
    color: cardBg,
    borderColor: cardBorder,
    borderWidth: 1,
  });

  const matrixInfo = [
    '* 8 Tracks x 8 Steps per page: Tracks 1 to 8 correspond to rows 8 down to 1 on physical Launchpad X.',
    '  - Row 8 (Note 81-88): Track 1 - 808 Sub Kick       - Row 4 (Note 41-48): Track 5 - Clap / Percussion',
    '  - Row 7 (Note 71-78): Track 2 - Snare Drum         - Row 3 (Note 31-38): Track 6 - Acid Resonant Bass',
    '  - Row 6 (Note 61-68): Track 3 - Closed Hi-Hat       - Row 2 (Note 21-28): Track 7 - Synth Lead Melodic',
    '  - Row 5 (Note 51-58): Track 4 - Open Hi-Hat         - Row 1 (Note 11-18): Track 8 - Polyphonic Chord Stab',
    '* Playhead Visual Sweep: High-speed delta ticks flash white on active beats, sweeping left-to-right.',
    '* Unused Pads Toggle: Option in UI to switch idle pads between unlit [OFF] and subtle track-tinted [FADED].',
  ];

  matrixInfo.forEach((line, idx) => {
    page3.drawText(line, {
      x: 48,
      y: y - 18 - idx * 12,
      size: 8,
      font: idx === 0 || idx >= 5 ? fontBold : fontMono,
      color: idx === 0 || idx >= 5 ? textWhite : textGray,
    });
  });

  y -= 115;

  // Operational Modes
  page3.drawText('CORE OPERATIONAL MODES', {
    x: 36,
    y: y,
    size: 11,
    font: fontBold,
    color: textWhite,
  });

  y -= 15;

  const modes = [
    {
      title: 'SESSION / SEQUENCER MODE (DAW PROGRAMMER)',
      color: cyan,
      body: 'Full 8-track polyphonic step sequencer. The Launchpad X hardware is put into Programmer Mode with DAW mode ON. Pads act as step toggles. Top and Scene buttons function as sequencer transport, octave, bank, and mute/solo controls. Real-time LED feedback reflects the audio clock sweep.',
    },
    {
      title: 'NOTE MODE (STANDALONE SCALES & INSTRUMENT)',
      color: purple,
      body: 'Puts the Launchpad X into native Standalone Note Mode (DAW mode released via SysEx). The Launchpad X hardware scale engine takes over. You can play melodic scales, chords, and basslines directly with polyphonic aftertouch. Notes trigger the built-in synth engine and external MIDI outputs.',
    },
    {
      title: 'CUSTOM MODE (USER MAPPINGS)',
      color: amber,
      body: 'Selects the hardware Custom 1 layout. Useful for integrating with third-party software, DAW controllers, or custom Novation Components templates while running the sequencer.',
    },
  ];

  modes.forEach((m) => {
    page3.drawRectangle({
      x: 36,
      y: y - 56,
      width: pageWidth - 72,
      height: 52,
      color: cardBg,
      borderColor: cardBorder,
      borderWidth: 1,
    });

    page3.drawText(m.title, {
      x: 48,
      y: y - 18,
      size: 9,
      font: fontBold,
      color: m.color,
    });

    page3.drawText(m.body, {
      x: 48,
      y: y - 34,
      size: 8,
      font: fontRegular,
      color: textGray,
      maxWidth: pageWidth - 96,
      lineHeight: 11,
    });

    y -= 64;
  });

  y -= 10;

  // Row Colors Customization
  page3.drawText('ROW COLOR CUSTOMIZATION (NOVATION LPX RGB PALETTE)', {
    x: 36,
    y: y,
    size: 11,
    font: fontBold,
    color: textWhite,
  });

  y -= 15;

  page3.drawRectangle({
    x: 36,
    y: y - 110,
    width: pageWidth - 72,
    height: 110,
    color: cardBg,
    borderColor: cyan,
    borderWidth: 1,
  });

  page3.drawText('You can customize the color of each of the 8 sequencer rows independently:', {
    x: 48,
    y: y - 18,
    size: 8.5,
    font: fontBold,
    color: textWhite,
  });

  const colorFeatures = [
    '1. Left Row Track Header Swatches: Click the color dot next to any track row (T1..T8) on the Launchpad chassis.',
    '2. Toolbar "Row Colors" Button: Opens a modal with all 8 rows and the full 14-preset Launchpad X palette.',
    '3. Bottom Track Indicator Strip: Click any track badge to select it or pick a new LED color.',
    '4. Track Inspector Deck: Select any track and click any of the 14 Novation Launchpad X palette circles.',
    '* Immediate Hardware Sync: Selecting any color immediately transmits the exact Novation color index byte',
    '  to the physical controller LEDs, updating both active step pads and faded background tints instantly.',
    '* 14 LPX Presets: Red (#5), Amber (#9), Orange (#60), Yellow (#13), Lime (#17), Green (#21), Mint (#29),',
    '  Cyan (#37), Sky (#41), Blue (#45), Purple (#49), Magenta (#53), Pink (#57), White (#3).',
  ];

  colorFeatures.forEach((line, idx) => {
    page3.drawText(line, {
      x: 48,
      y: y - 32 - idx * 9.5,
      size: 7.8,
      font: fontRegular,
      color: textGray,
    });
  });

  // ==========================================
  // PAGE 4: ABLETON LINK, PI ZERO W & QUICK REF
  // ==========================================
  const page4 = createPageWithHeader('4. Ableton Link, Pi Zero W & Quick Reference', 'Wireless tempo sync, embedded headless deployment, and shortcut reference', 4, 4);
  y = pageHeight - 130;

  // Ableton Link & Pi Section
  page4.drawText('ABLETON LINK & RASPBERRY PI ZERO W DEPLOYMENT', {
    x: 36,
    y: y,
    size: 11,
    font: fontBold,
    color: textWhite,
  });

  y -= 15;

  page4.drawRectangle({
    x: 36,
    y: y - 110,
    width: pageWidth - 72,
    height: 110,
    color: cardBg,
    borderColor: cardBorder,
    borderWidth: 1,
  });

  const piInfo = [
    '* Ableton Link: Built-in wireless tempo and phase synchronization across DAWs, synths, and iOS/Android apps.',
    '  - Quantum and Peer tracking: Displays active connected peers and real-time beat phase metronome (1-4).',
    '* Raspberry Pi Zero W Deployment: Perfect for portable, dawless standalone operation.',
    '  - USB OTG Host: Connect Launchpad X directly to Pi Zero W micro-USB port using an OTG adapter.',
    '  - Headless Python/ALSA Sequencer: Export sequencer patterns as Pi JSON configs directly from the UI.',
    '  - Systemd Service: Automatic launch on boot without requiring a monitor, keyboard, or mouse.',
    '* Polymetric & Euclidean Rhythms: Each track supports independent polymetric loop lengths (1 to 16 steps)',
    '  and Euclidean algorithmic hit distributions (e.g. E(5, 16) for afro-cuban polyrhythms).',
  ];

  piInfo.forEach((line, idx) => {
    page4.drawText(line, {
      x: 48,
      y: y - 18 - idx * 12.5,
      size: 8,
      font: fontRegular,
      color: textGray,
      maxWidth: pageWidth - 96,
    });
  });

  y -= 130;

  // Quick Reference Table
  page4.drawText('QUICK BUTTON & SHORTCUT REFERENCE TABLE', {
    x: 36,
    y: y,
    size: 11,
    font: fontBold,
    color: textWhite,
  });

  y -= 15;

  const tableHeaderY = y;
  page4.drawRectangle({
    x: 36,
    y: tableHeaderY - 20,
    width: pageWidth - 72,
    height: 20,
    color: cardBorder,
  });

  page4.drawText('BUTTON / CONTROL', { x: 44, y: tableHeaderY - 14, size: 8, font: fontBold, color: textWhite });
  page4.drawText('HARDWARE CC / NOTE', { x: 175, y: tableHeaderY - 14, size: 8, font: fontBold, color: textWhite });
  page4.drawText('PRIMARY ACTION IN SEQUENCER', { x: 300, y: tableHeaderY - 14, size: 8, font: fontBold, color: textWhite });

  y -= 20;

  const tableRows = [
    { name: 'Up Arrow', id: 'CC 91', action: 'Octave Shift Up (+12) / Tempo Increment (+2 BPM)' },
    { name: 'Down Arrow', id: 'CC 92', action: 'Octave Shift Down (-12) / Tempo Decrement (-2 BPM)' },
    { name: 'Left Arrow', id: 'CC 93', action: 'Switch to Step Bank 1 (Steps 1-8)' },
    { name: 'Right Arrow', id: 'CC 94', action: 'Switch to Step Bank 2 (Steps 9-16)' },
    { name: 'Session / Mixer', id: 'CC 95', action: 'Engage 8-Track Step Sequencer (DAW Programmer Mode)' },
    { name: 'Note Mode', id: 'CC 96', action: 'Release DAW mode; play live scales with hardware engine' },
    { name: 'Custom Mode', id: 'CC 97', action: 'Switch to Launchpad User Custom 1 Layout' },
    { name: 'Record / Play', id: 'CC 98', action: 'Master Transport Play / Stop toggle' },
    { name: 'Volume (Scene 8)', id: 'CC 89 / Note 89', action: 'Cycle selected active track (Track 1 to Track 8)' },
    { name: 'Pan (Scene 7)', id: 'CC 79 / Note 79', action: 'Cycle view mode (Grid / 64-Step Melodic / Euclidean)' },
    { name: 'Send A (Scene 6)', id: 'CC 69 / Note 69', action: 'Select Page 1 (Steps 1-8)' },
    { name: 'Send B (Scene 5)', id: 'CC 59 / Note 59', action: 'Select Page 2 (Steps 9-16)' },
    { name: 'Stop Clip (Scene 4)', id: 'CC 49 / Note 49', action: 'Panic / Silence all voices and stop playback immediately' },
    { name: 'Mute (Scene 3)', id: 'CC 39 / Note 39', action: 'Toggle Mute on the active track (lights red when active)' },
    { name: 'Solo (Scene 2)', id: 'CC 29 / Note 29', action: 'Toggle Solo on the active track (lights green when active)' },
    { name: 'Record Arm (Scene 1)', id: 'CC 19 / Note 19', action: 'Toggle Transport Play/Stop (lights red when running)' },
    { name: '8x8 Silicone Pads', id: 'Notes 11-88', action: 'Toggle individual sequence steps on active page' },
    { name: 'Unused Pads (UI)', id: 'Toolbar Toggle', action: 'Switch idle pad LEDs between unlit [OFF] and [FADED]' },
    { name: 'Row Colors (UI)', id: 'Toolbar / Swatches', action: 'Choose from 14 official Novation Launchpad X colors' },
  ];

  tableRows.forEach((row, i) => {
    const isEven = i % 2 === 0;
    page4.drawRectangle({
      x: 36,
      y: y - 18,
      width: pageWidth - 72,
      height: 18,
      color: isEven ? cardBg : darkBg,
      borderColor: cardBorder,
      borderWidth: 0.5,
    });

    page4.drawText(row.name, { x: 44, y: y - 13, size: 7.5, font: fontBold, color: cyan });
    page4.drawText(row.id, { x: 175, y: y - 13, size: 7.5, font: fontMono, color: textDim });
    page4.drawText(row.action, { x: 300, y: y - 13, size: 7.5, font: fontRegular, color: textGray });

    y -= 18;
  });

  // Footer on page 4
  y -= 12;
  page4.drawText('Novation Launchpad X is a trademark of Focusrite Audio Engineering Ltd. Manual created for Launchpad X Sequencer Studio.', {
    x: 36,
    y: y,
    size: 7,
    font: fontRegular,
    color: textDim,
  });

  const pdfBytes = await doc.save();

  // Save to both public and docs directory
  const publicDir = path.resolve('public');
  const docsDir = path.resolve('docs');

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const publicPath = path.join(publicDir, 'Launchpad_X_User_Manual.pdf');
  const docsPath = path.join(docsDir, 'Launchpad_X_User_Manual.pdf');

  fs.writeFileSync(publicPath, pdfBytes);
  fs.writeFileSync(docsPath, pdfBytes);

  console.log('PDF User Manual successfully generated:');
  console.log(' - ' + publicPath);
  console.log(' - ' + docsPath);
}

generateManual().catch(console.error);
