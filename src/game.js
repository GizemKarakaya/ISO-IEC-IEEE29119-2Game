const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const COLORS = {
  bg: 0x07111f,
  floor: 0x243447,
  floorAlt: 0x2b4057,
  grid: 0x49627a,
  panel: 0x111827,
  panelDark: 0x060b14,
  ink: 0xf8fafc,
  muted: 0x94a3b8,
  cyan: 0x38bdf8,
  blue: 0x60a5fa,
  green: 0x22c55e,
  red: 0xef4444,
  amber: 0xf59e0b,
  purple: 0xa78bfa
};

const FONT = '"Courier New", monospace';
const TABLE_LABEL_FONT = '"Segoe UI", Arial, sans-serif';
const OFFICE = { x: 24, y: 78, width: 1232, height: 612 };
const TABLE_W = 176;
const TABLE_H = 72;
const LAYERS = [
  { title: "Organizational Layer", y: 98, h: 134, wall: 0x2f4a3f, floor: 0x8b6f47, floorAlt: 0x7b623f, trim: 0x38bdf8 },
  { title: "Test Management Layer", y: 292, h: 144, wall: 0x4a405d, floor: 0x9a7650, floorAlt: 0x856645, trim: 0xa78bfa },
  { title: "Dynamic Test Processes Layer", y: 504, h: 156, wall: 0x3f563a, floor: 0x94734e, floorAlt: 0x806443, trim: 0x22c55e }
];

const TABLES = [
  { id: "OT1", label: "OT1", fullName: "Develop Organizational Test Specification", layer: "organizational", x: 270, y: 188, baseRate: 1.0 },
  { id: "OT2", label: "OT2", fullName: "Monitor and Control Organizational Test Specification", layer: "organizational", x: 590, y: 188, baseRate: 1.0 },
  { id: "OT3", label: "OT3", fullName: "Update Organizational Test Specification", layer: "organizational", x: 910, y: 188, baseRate: 1.0 },
  { id: "TMP1", label: "TMP1", fullName: "Test Strategy and Planning", layer: "management", x: 210, y: 364, baseRate: 1.0 },
  { id: "TMP2", label: "TMP2", fullName: "Test Monitoring and Control", layer: "management", x: 500, y: 364, baseRate: 1.1 },
  { id: "TMP3", label: "TMP3", fullName: "Test Completion", layer: "management", x: 790, y: 364, baseRate: 1.0 },
  { id: "DP1", label: "DP1", fullName: "Test Design and Implementation", layer: "dynamic", x: 180, y: 590, baseRate: 1.0 },
  { id: "DP2", label: "DP2", fullName: "Test Environment and Data Management", layer: "dynamic", x: 430, y: 590, baseRate: 1.0 },
  { id: "DP3", label: "DP3", fullName: "Test Execution", layer: "dynamic", x: 680, y: 590, baseRate: 1.0 },
  { id: "DP4", label: "DP4", fullName: "Test Incident Reporting", layer: "dynamic", x: 930, y: 590, baseRate: 1.0 }
];

const FLOWS = [
  { from: "OT1", to: "OT2", type: "primary" },
  { from: "OT2", to: "OT3", type: "primary" },
  { from: "OT2", to: "TMP2", type: "primary" },
  { from: "OT1", to: "TMP1", type: "primary" },
  { from: "TMP1", to: "TMP2", type: "primary" },
  { from: "TMP2", to: "TMP1", type: "feedback" },
  { from: "TMP2", to: "TMP3", type: "primary" },
  { from: "TMP3", to: "TMP2", type: "feedback" },
  { from: "TMP2", to: "DP1", type: "primary" },
  { from: "TMP2", to: "DP2", type: "primary" },
  { from: "DP1", to: "DP3", type: "primary" },
  { from: "DP2", to: "DP3", type: "primary" },
  { from: "DP3", to: "DP4", type: "primary" },
  { from: "TMP2", to: "DP3", type: "feedback" },
  { from: "DP4", to: "TMP2", type: "feedback" },
  { from: "DP4", to: "OT3", type: "feedback" }
];

const DEFAULT_QUESTIONS = {
  ORG: {
    easy: [{ q: "What is the main purpose of the Organizational Test Process?", options: ["To execute test cases", "To develop and manage organizational test specifications", "To report software defects", "To close the test environment"], correct: 1 }],
    medium: [{ q: "What does monitoring conformance in the Organizational Test Process help achieve?", options: ["It checks whether organizational test specifications are being followed", "It replaces test execution", "It creates test data automatically", "It removes stakeholders from testing"], correct: 0 }],
    hard: [{ q: "Why is the Organizational Test Process considered a governance-level process?", options: ["Because it runs every test case manually", "Because it defines organization-wide rules, policies, and practices for testing", "Because it only reports defects", "Because it only prepares test data"], correct: 1 }]
  }
};
const DIFFICULTIES = {
  easy: { label: "Easy", alertEveryMs: 10000, warningMs: 9000, cooldownMs: 5200 },
  medium: { label: "Medium", alertEveryMs: 10000, warningMs: 7600, cooldownMs: 6800 },
  hard: { label: "Hard", alertEveryMs: 10000, warningMs: 6200, cooldownMs: 8200 }
};

const SHOW_CORRECT_ANSWER_DEBUG = false;

class OfficeScene extends Phaser.Scene {
  constructor() {
    super("office-scene");
    this.tableState = new Map();
    this.tableGraphics = new Map();
    this.flowParticles = [];
    this.ev = 0;
    this.pv = 0;
    this.totalTime = 0;
    this.alertTimer = 0;
    this.alertEveryMs = DIFFICULTIES.medium.alertEveryMs;
    this.warningMs = DIFFICULTIES.medium.warningMs;
    this.cooldownMs = DIFFICULTIES.medium.cooldownMs;
    this.difficulty = "medium";
    this.currentQuiz = null;
    this.isTutorialOpen = false;
    this.isMenuOpen = false;
    this.score = 0;
    this.questionBank = DEFAULT_QUESTIONS;
    this.gameDurationMs = 90000;
    this.remainingMs = this.gameDurationMs;
    this.plannedRatePerSec = 100 / (this.gameDurationMs / 1000);
    this.hasGameStarted = false;
    this.gameOver = false;
    this.gameResultText = "";
    this.lastQuestionByTable = {};
    this.questionHistoryByTable = {};
    this.recentAlertTables = [];
    this.alertCountByTable = {};
    this.walkFrameMs = 0;
    this.walkFrame = 0;
    this.quizAnswered = false;
    this.usingCustomPlayer = true;
    this.customPlayerReady = false;
  }

  preload() {
    this.load.json("questions", "./src/questions.json?v=20260509-questions");
    this.load.image("player-custom", "./src/player-custom.png?v=20260509-main-character");
    this.load.image("player-custom-walk", "./src/player-custom.png?v=20260509-main-character");
  }

  create() {
    const loadedQuestions = this.cache.json.get("questions");
    if (loadedQuestions) {
      this.questionBank = loadedQuestions;
    }
    this.cameras.main.setBackgroundColor("#07111f");
    this.createPixelTextures();
    this.drawPixelOfficeFloor();
    this.drawLayers();
    this.createTables();
    this.createFlows();
    this.createUI();
    this.createPlayer();
    this.createTutorial();
    this.createStartOverlay();
    this.input.keyboard.on("keydown-E", () => this.tryInteract());
    this.input.keyboard.on("keydown-H", () => this.toggleTutorial());
    this.input.keyboard.on("keydown-ONE", () => this.setDifficulty("easy"));
    this.input.keyboard.on("keydown-TWO", () => this.setDifficulty("medium"));
    this.input.keyboard.on("keydown-THREE", () => this.setDifficulty("hard"));
    this.input.keyboard.on("keydown-ENTER", () => this.startGame());
    this.input.keyboard.on("keydown-SPACE", () => this.startGame());
    this.input.keyboard.on("keydown-K", () => this.togglePlayerModel());
    this.input.keyboard.on("keydown-ESC", () => this.handleEscAction());
    this.input.keyboard.on("keydown-W", () => this.closeAnsweredQuiz());
    this.input.keyboard.on("keydown-A", () => this.closeAnsweredQuiz());
    this.input.keyboard.on("keydown-S", () => this.closeAnsweredQuiz());
    this.input.keyboard.on("keydown-D", () => this.closeAnsweredQuiz());
  }

  drawLayers() {
    const layerStyle = { fontFamily: FONT, fontSize: "15px", color: "#f8fafc", fontStyle: "bold" };
    LAYERS.forEach((layer) => {
      this.add.text(42, layer.y - 18, layer.title, layerStyle);
      const plate = this.add.rectangle(44, layer.y + 10, 12, 12, layer.trim).setOrigin(0, 0);
      plate.setStrokeStyle(2, 0x020617);
    });
  }

  createPixelTextures() {
    if (!this.textures.exists("player-idle")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x312e81);
      g.fillRect(6, 0, 20, 7);
      g.fillStyle(0x4c1d95);
      g.fillRect(4, 6, 24, 14);
      g.fillStyle(0xf2c6a0);
      g.fillRect(9, 7, 14, 11);
      g.fillStyle(0xde3f8f);
      g.fillRect(6, 19, 20, 9);
      g.fillStyle(0xf9a8d4);
      g.fillRect(8, 19, 16, 3);
      g.fillStyle(0x111827);
      g.fillRect(11, 9, 3, 3);
      g.fillRect(18, 9, 3, 3);
      g.fillStyle(0x7c2d12);
      g.fillRect(5, 14, 4, 12);
      g.fillRect(23, 14, 4, 12);
      g.fillStyle(0x1f2937);
      g.fillRect(9, 29, 5, 3);
      g.fillRect(18, 29, 5, 3);
      g.generateTexture("player-idle", 32, 32);
      g.destroy();
    }
    if (!this.textures.exists("player-walk-1")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x312e81);
      g.fillRect(6, 0, 20, 7);
      g.fillStyle(0x4c1d95);
      g.fillRect(4, 6, 24, 14);
      g.fillStyle(0xf2c6a0);
      g.fillRect(9, 7, 14, 11);
      g.fillStyle(0xde3f8f);
      g.fillRect(6, 19, 20, 9);
      g.fillStyle(0xf9a8d4);
      g.fillRect(8, 19, 16, 3);
      g.fillStyle(0x111827);
      g.fillRect(11, 9, 3, 3);
      g.fillRect(18, 9, 3, 3);
      g.fillStyle(0x7c2d12);
      g.fillRect(3, 15, 5, 12);
      g.fillRect(24, 13, 5, 12);
      g.fillStyle(0x1f2937);
      g.fillRect(6, 29, 6, 3);
      g.fillRect(20, 29, 6, 3);
      g.generateTexture("player-walk-1", 32, 32);
      g.destroy();
    }
    if (!this.textures.exists("player-walk-2")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x312e81);
      g.fillRect(6, 0, 20, 7);
      g.fillStyle(0x4c1d95);
      g.fillRect(4, 6, 24, 14);
      g.fillStyle(0xf2c6a0);
      g.fillRect(9, 7, 14, 11);
      g.fillStyle(0xde3f8f);
      g.fillRect(6, 19, 20, 9);
      g.fillStyle(0xf9a8d4);
      g.fillRect(8, 19, 16, 3);
      g.fillStyle(0x111827);
      g.fillRect(11, 9, 3, 3);
      g.fillRect(18, 9, 3, 3);
      g.fillStyle(0x7c2d12);
      g.fillRect(4, 13, 5, 12);
      g.fillRect(25, 15, 5, 12);
      g.fillStyle(0x1f2937);
      g.fillRect(10, 29, 6, 3);
      g.fillRect(16, 29, 6, 3);
      g.generateTexture("player-walk-2", 32, 32);
      g.destroy();
    }
  }

  drawPixelOfficeFloor() {
    const floor = this.add.graphics().setDepth(-20);
    floor.fillStyle(COLORS.bg);
    floor.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    floor.fillStyle(0x111827, 1);
    floor.fillRect(0, 0, GAME_WIDTH, 62);
    floor.fillStyle(0x020617, 1);
    floor.fillRect(0, 62, GAME_WIDTH, 5);

    floor.fillStyle(0x8b6f47, 1);
    floor.fillRect(OFFICE.x - 4, OFFICE.y - 4, OFFICE.width + 8, OFFICE.height + 8);

    const plankH = 18;
    for (let y = OFFICE.y; y < OFFICE.y + OFFICE.height; y += plankH) {
      const row = Math.floor((y - OFFICE.y) / plankH);
      const offset = (row % 2) * 42;
      floor.fillStyle(row % 2 === 0 ? 0x8b6f47 : 0x806443, 1);
      floor.fillRect(OFFICE.x, y, OFFICE.width, plankH - 2);
      floor.lineStyle(1, 0x4a3524, 0.28);
      floor.lineBetween(OFFICE.x, y, OFFICE.x + OFFICE.width, y);
      for (let x = OFFICE.x - offset; x < OFFICE.x + OFFICE.width; x += 84) {
        floor.lineBetween(x, y, x, y + plankH - 2);
      }
    }

    LAYERS.forEach((layer) => {
      floor.fillStyle(layer.trim, 0.08);
      floor.fillRect(OFFICE.x, layer.y - 12, OFFICE.width, layer.h + 12);
      floor.fillStyle(layer.trim, 0.18);
      floor.fillRect(OFFICE.x, layer.y - 3, OFFICE.width, 3);
      floor.fillRect(OFFICE.x, layer.y + layer.h - 3, OFFICE.width, 3);
    });

    this.drawOfficeProps(floor);
  }

  drawOfficeProps(floor) {
    floor.fillStyle(0x111827, 0.45);
    floor.fillRect(1106, 330, 70, 48);
    floor.fillStyle(0x475569, 1);
    floor.fillRect(1110, 326, 62, 42);
    floor.fillStyle(0x64748b, 1);
    floor.fillRect(1115, 320, 52, 12);
    floor.fillStyle(0xe2e8f0, 1);
    floor.fillRect(1122, 307, 38, 22);
    floor.fillStyle(0x0f172a, 1);
    floor.fillRect(1120, 348, 42, 8);
    floor.fillStyle(0x38bdf8, 1);
    floor.fillRect(1122, 335, 12, 6);
    floor.fillStyle(0x22c55e, 1);
    floor.fillRect(1142, 336, 5, 5);
    floor.fillStyle(0xef4444, 1);
    floor.fillRect(1152, 336, 5, 5);
    floor.fillStyle(0xf8fafc, 1);
    floor.fillRect(1124, 358, 36, 14);

    floor.fillStyle(0x1f2937, 1);
    floor.fillRect(1136, 582, 34, 42);
    floor.fillStyle(0x475569, 1);
    floor.fillRect(1132, 574, 42, 10);
    floor.fillStyle(0x0f172a, 1);
    floor.fillRect(1142, 590, 22, 24);

    this.drawPlant(floor, 1190, 126);
    this.drawPlant(floor, 70, 620);
    this.drawPlant(floor, 1084, 438);
  }

  drawPlant(graphics, x, y) {
    graphics.fillStyle(0x7c2d12, 1);
    graphics.fillRect(x - 12, y + 18, 24, 18);
    graphics.fillStyle(0x14532d, 1);
    graphics.fillRect(x - 5, y + 2, 10, 22);
    graphics.fillStyle(0x22c55e, 1);
    graphics.fillRect(x - 24, y - 8, 18, 14);
    graphics.fillRect(x + 6, y - 12, 20, 16);
    graphics.fillRect(x - 10, y - 22, 20, 18);
  }

  createTables() {
    TABLES.forEach((table) => {
      this.tableState.set(table.id, {
        ...table,
        status: "normal",
        statusUntil: 0,
        quizLocked: false,
        exclamation: null,
        alertCount: 0
      });

      const shadow = this.add.rectangle(table.x + 6, table.y + 12, TABLE_W, TABLE_H, 0x020617, 0.44);
      const employee = this.add.graphics();
      const shirt = table.x % 3 === 0 ? 0x0ea5e9 : table.x % 2 === 0 ? 0x22c55e : 0xf97316;
      const hair = [0x3b2417, 0x111827, 0x92400e, 0x581c87][TABLES.indexOf(table) % 4];
      employee.fillStyle(0x111827);
      employee.fillRect(table.x - 18, table.y - 28, 36, 22);
      employee.fillStyle(shirt);
      employee.fillRect(table.x - 14, table.y - 39, 28, 24);
      employee.fillStyle(0xf2c6a0);
      employee.fillRect(table.x - 11, table.y - 60, 22, 20);
      employee.fillStyle(hair);
      if (TABLES.indexOf(table) % 3 === 0) {
        employee.fillRect(table.x - 15, table.y - 66, 30, 12);
        employee.fillRect(table.x - 16, table.y - 56, 6, 15);
        employee.fillRect(table.x + 10, table.y - 56, 6, 15);
      } else if (TABLES.indexOf(table) % 3 === 1) {
        employee.fillRect(table.x - 13, table.y - 66, 26, 8);
        employee.fillRect(table.x - 13, table.y - 58, 8, 7);
      } else {
        employee.fillRect(table.x - 11, table.y - 68, 22, 10);
        employee.fillRect(table.x + 7, table.y - 58, 8, 10);
      }
      employee.fillStyle(0x111827);
      employee.fillRect(table.x - 7, table.y - 53, 3, 3);
      employee.fillRect(table.x + 5, table.y - 53, 3, 3);
      employee.fillRect(table.x - 4, table.y - 45, 8, 2);
      employee.fillStyle(0xf2c6a0);
      employee.fillRect(table.x - 24, table.y - 30, 10, 6);
      employee.fillRect(table.x + 14, table.y - 30, 10, 6);
      employee.setY(-5);
      const legs = this.add.graphics();
      legs.fillStyle(0x111827);
      legs.fillRect(table.x - 76, table.y + 30, 10, 20);
      legs.fillRect(table.x + 66, table.y + 30, 10, 20);
      const g = this.add.rectangle(table.x, table.y, TABLE_W, TABLE_H, 0x6b4423).setStrokeStyle(4, 0x2b170c);
      const lip = this.add.rectangle(table.x, table.y - 30, TABLE_W - 18, 10, 0x8b5a2b);
      const monitor = this.add.rectangle(table.x + 58, table.y + 2, 30, 22, 0x0f172a).setStrokeStyle(3, 0x38bdf8);
      const screen = this.add.rectangle(table.x + 58, table.y + 2, 18, 10, 0x164e63);
      const stand = this.add.rectangle(table.x + 58, table.y + 21, 14, 7, 0x475569);
      const keyboard = this.add.graphics();
      this.drawKeyboard(keyboard, table.x + 58, table.y - 22);
      const processLabel = this.add.text(table.x - 30, table.y + 2, this.wrap(table.fullName, 18), {
        fontFamily: TABLE_LABEL_FONT,
        fontSize: "11px",
        color: "#fff7ed",
        align: "center",
        fontStyle: "700",
        lineSpacing: 0,
        resolution: 2,
        wordWrap: { width: 116, useAdvancedWrap: true }
      }).setOrigin(0.5);
      this.tableGraphics.set(table.id, { shadow, employee, legs, g, lip, monitor, screen, stand, keyboard, processLabel });
    });
  }

  drawKeyboard(graphics, x, y) {
    graphics.fillStyle(0x1f2937, 1);
    graphics.fillRect(x - 26, y - 6, 52, 14);
    graphics.fillStyle(0x475569, 1);
    graphics.fillRect(x - 22, y - 3, 6, 3);
    graphics.fillRect(x - 13, y - 3, 6, 3);
    graphics.fillRect(x - 4, y - 3, 6, 3);
    graphics.fillRect(x + 5, y - 3, 6, 3);
    graphics.fillRect(x + 14, y - 3, 6, 3);
    graphics.fillRect(x - 18, y + 3, 8, 3);
    graphics.fillRect(x - 7, y + 3, 18, 3);
    graphics.fillRect(x + 14, y + 3, 8, 3);
  }

  createFlows() {
    this.flowLines = this.add.graphics();
    this.flowDots = this.add.graphics();
    this.flowLines.setDepth(-5);
    this.flowDots.setDepth(-4);
    this.redrawFlowLines();
  }

  createUI() {
    this.hudTop = this.add.graphics().setDepth(100);
    this.hudTop.fillStyle(0x020617, 0.86);
    this.hudTop.fillRect(0, 0, GAME_WIDTH, 62);
    this.hudTop.lineStyle(4, 0x38bdf8, 0.88);
    this.hudTop.lineBetween(0, 62, GAME_WIDTH, 62);

    this.statusText = this.add.text(24, 18, "Warnings 0 | Cooldowns 0", {
      fontFamily: FONT,
      fontSize: "15px",
      color: "#cbd5e1"
    }).setDepth(101);
    this.timeText = this.add.text(245, 18, "Time 90s", {
      fontFamily: FONT,
      fontSize: "15px",
      color: "#fde68a"
    }).setDepth(101);

    this.evBarBg = this.add.rectangle(500, 19, 340, 14, 0x111827).setOrigin(0, 0.5).setStrokeStyle(3, 0x064e3b).setDepth(101);
    this.evBar = this.add.rectangle(500, 19, 1, 14, 0x22c55e).setOrigin(0, 0.5).setDepth(102);
    this.pvBarBg = this.add.rectangle(500, 43, 340, 14, 0x111827).setOrigin(0, 0.5).setStrokeStyle(3, 0x1d4ed8).setDepth(101);
    this.pvBar = this.add.rectangle(500, 43, 1, 14, 0x3b82f6).setOrigin(0, 0.5).setDepth(102);

    this.add.text(464, 11, "EV", { fontFamily: FONT, fontSize: "14px", color: "#86efac" }).setDepth(101);
    this.add.text(464, 35, "PV", { fontFamily: FONT, fontSize: "14px", color: "#93c5fd" }).setDepth(101);
    this.evPvText = this.add.text(872, 18, "EV = PV", { fontFamily: FONT, fontSize: "14px", color: "#f8fafc" }).setDepth(101);
    this.difficultyText = this.add.text(872, 39, "Difficulty Medium", {
      fontFamily: FONT,
      fontSize: "14px",
      color: "#c4b5fd"
    }).setDepth(101);

    this.exitButton = this.add.rectangle(1215, 34, 110, 42, 0x7f1d1d)
      .setStrokeStyle(2, 0xfca5a5)
      .setDepth(1300)
      .setInteractive({ useHandCursor: true });
    this.exitButtonText = this.add.text(1215, 34, "EXIT", {
      fontSize: "20px",
      fontFamily: FONT,
      color: "#fee2e2",
      fontStyle: "bold"
    }).setOrigin(0.5).setDepth(1301);
    this.exitButton.on("pointerover", () => this.exitButton.setFillStyle(0x991b1b));
    this.exitButton.on("pointerout", () => this.exitButton.setFillStyle(0x7f1d1d));
    this.exitButton.on("pointerdown", () => this.restartGame());

    this.quizContainer = this.add.container(0, 0).setDepth(1000).setVisible(false);
    this.endContainer = this.add.container(0, 0).setDepth(2000).setVisible(false);
  }

  createTutorial() {
    this.tutorialContainer = this.add.container(0, 0).setDepth(1200).setVisible(false);

    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 940, 460, 0x020617, 0.96)
      .setStrokeStyle(3, 0x38bdf8);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 175, "Quick Demo: How to Play", {
      fontSize: "36px",
      color: "#f8fafc",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const body = this.add.text(
      GAME_WIDTH / 2 - 420,
      GAME_HEIGHT / 2 - 112,
      [
        "1) Move around the office with WASD.",
        "2) If you see ! on a desk, that process is slowing down.",
        "3) Walk to the desk and press E to open the question.",
        "4) Correct answer: the process returns to normal and EV recovers.",
        "5) Wrong or late answer: the desk enters cooldown and linked flows slow down.",
        "",
        "Goal: keep EV from falling far behind PV."
      ].join("\n"),
      {
        fontSize: "18px",
        color: "#dbeafe",
        align: "left",
        lineSpacing: 12,
        wordWrap: { width: 840, useAdvancedWrap: true }
      }
    );

    const closeHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 185, "Close: H or ESC", {
      fontSize: "18px",
      color: "#93c5fd"
    }).setOrigin(0.5);

    this.tutorialContainer.add([bg, title, body, closeHint]);
  }

  createStartOverlay() {
    this.startContainer = this.add.container(0, 0).setDepth(1400).setVisible(true);
    this.isMenuOpen = true;

    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020617, 0.58);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1080, 640, 0x111827, 0.98)
      .setStrokeStyle(5, 0x22d3ee);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 275, "PROCESS PANIC", {
      fontFamily: FONT,
      fontSize: "34px",
      color: "#e2e8f0",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 238, "Test Office", {
      fontFamily: FONT,
      fontSize: "18px",
      color: "#93c5fd"
    }).setOrigin(0.5);
    const body = this.add.text(
      GAME_WIDTH / 2 - 460,
      GAME_HEIGHT / 2 - 205,
      [
        "Goal:",
        "- Keep Earned Value (EV) close to or ahead of Planned Value (PV) before time runs out.",
        "",
        "Game structure:",
        "- Each desk is an ISO/IEC/IEEE 29119-2 process.",
        "- After the first warning, process desks may raise warnings every 10 seconds.",
        "- Walk near a warning desk and press E to answer a process question.",
        "- The selected difficulty controls which question set appears.",
        "- Correct answers recover EV; wrong answers put the desk in cooldown.",
        "- H opens help. ESC opens the pause menu.",
        ""
      ].join("\n"),      { fontSize: "15px", color: "#dbeafe", lineSpacing: 4, wordWrap: { width: 920, useAdvancedWrap: true } }
    );
    body.setVisible(true);

    const legendGraphics = this.add.graphics();
    this.drawLegendArrow(legendGraphics, GAME_WIDTH / 2 - 395, GAME_HEIGHT / 2 + 62, 0x60a5fa);
    this.drawLegendArrow(legendGraphics, GAME_WIDTH / 2 - 395, GAME_HEIGHT / 2 + 94, 0x5eead4);
    const primaryLegend = this.add.text(GAME_WIDTH / 2 - 330, GAME_HEIGHT / 2 + 50, "Blue arrows: main process sequence", {
      fontFamily: TABLE_LABEL_FONT,
      fontSize: "15px",
      color: "#dbeafe"
    });
    const feedbackLegend = this.add.text(GAME_WIDTH / 2 - 330, GAME_HEIGHT / 2 + 82, "Teal arrows: monitoring and feedback paths", {
      fontFamily: TABLE_LABEL_FONT,
      fontSize: "15px",
      color: "#ccfbf1"
    });

    const button = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 170, 216, 58, 0x16a34a)
      .setStrokeStyle(3, 0x86efac)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 170, "PLAY", {
      fontFamily: FONT,
      fontSize: "28px",
      color: "#ecfdf5",
      fontStyle: "bold"
    }).setOrigin(0.5);
    this.playButtonText = buttonText;
    this.difficultyMenuButtons = ["easy", "medium", "hard"].map((level, index) => {
      const x = GAME_WIDTH / 2 - 130 + index * 130;
      const box = this.add.rectangle(x, GAME_HEIGHT / 2 + 250, 112, 38, 0x1f2937)
        .setStrokeStyle(3, 0x475569)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(x, GAME_HEIGHT / 2 + 250, DIFFICULTIES[level].label.toUpperCase(), {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#e2e8f0",
        fontStyle: "bold"
      }).setOrigin(0.5);
      box.on("pointerdown", () => this.setDifficulty(level));
      box.on("pointerover", () => box.setFillStyle(0x334155));
      box.on("pointerout", () => this.updateDifficultyMenu());
      return { level, box, txt };
    });
    this.updateDifficultyMenu();

    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 292, "ESC opens the pause menu during play", {
      fontFamily: FONT,
      fontSize: "14px",
      color: "#94a3b8"
    }).setOrigin(0.5);

    button.on("pointerover", () => button.setFillStyle(0x15803d));
    button.on("pointerout", () => button.setFillStyle(0x16a34a));
    button.on("pointerdown", () => this.startGame());
    this.startContainer.add([
      shade,
      bg,
      title,
      subtitle,
      body,
      legendGraphics,
      primaryLegend,
      feedbackLegend,
      button,
      buttonText,
      ...this.difficultyMenuButtons.flatMap((item) => [item.box, item.txt]),
      hint
    ]);
    this.createPauseMenu();
  }

  drawLegendArrow(graphics, x, y, color) {
    graphics.lineStyle(4, 0x020617, 0.6);
    graphics.lineBetween(x, y, x + 48, y);
    graphics.lineStyle(2, color, 0.95);
    graphics.lineBetween(x, y, x + 48, y);
    graphics.fillStyle(color, 0.95);
    graphics.beginPath();
    graphics.moveTo(x + 56, y);
    graphics.lineTo(x + 44, y - 7);
    graphics.lineTo(x + 44, y + 7);
    graphics.closePath();
    graphics.fillPath();
  }

  createPauseMenu() {
    this.pauseContainer = this.add.container(0, 0).setDepth(1450).setVisible(false);
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x020617, 0.58);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 520, 330, 0x111827, 0.98)
      .setStrokeStyle(5, 0x5eead4);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 112, "PAUSE MENU", {
      fontFamily: FONT,
      fontSize: "32px",
      color: "#ecfeff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const resumeButton = this.add.rectangle(GAME_WIDTH / 2 - 125, GAME_HEIGHT / 2 - 12, 210, 58, 0x16a34a)
      .setStrokeStyle(3, 0x86efac)
      .setInteractive({ useHandCursor: true });
    const resumeText = this.add.text(GAME_WIDTH / 2 - 125, GAME_HEIGHT / 2 - 12, "RESUME", {
      fontFamily: FONT,
      fontSize: "24px",
      color: "#ecfdf5",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const restartButton = this.add.rectangle(GAME_WIDTH / 2 + 125, GAME_HEIGHT / 2 - 12, 210, 58, 0x0f766e)
      .setStrokeStyle(3, 0x5eead4)
      .setInteractive({ useHandCursor: true });
    const restartText = this.add.text(GAME_WIDTH / 2 + 125, GAME_HEIGHT / 2 - 12, "RESTART", {
      fontFamily: FONT,
      fontSize: "24px",
      color: "#ecfeff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 92, "Change difficulty from the start screen. Changing it resets the game.", {
      fontFamily: TABLE_LABEL_FONT,
      fontSize: "15px",
      color: "#cbd5e1",
      align: "center",
      wordWrap: { width: 430, useAdvancedWrap: true }
    }).setOrigin(0.5);
    resumeButton.on("pointerdown", () => {
      this.isMenuOpen = false;
      this.pauseContainer.setVisible(false);
    });
    restartButton.on("pointerdown", () => this.restartGame());
    this.pauseContainer.add([shade, bg, title, resumeButton, resumeText, restartButton, restartText, hint]);
  }

  updateDifficultyMenu() {
    if (!this.difficultyMenuButtons) return;
    this.difficultyMenuButtons.forEach(({ level, box, txt }) => {
      const selected = level === this.difficulty;
      box.setFillStyle(selected ? 0x0f766e : 0x1f2937);
      box.setStrokeStyle(3, selected ? 0x5eead4 : 0x475569);
      txt.setColor(selected ? "#ecfeff" : "#e2e8f0");
    });
  }

  syncMenuText() {
    if (this.playButtonText && this.playButtonText.setText) {
      this.playButtonText.setText(this.hasGameStarted ? "RESUME" : "PLAY");
    }
  }

  startGame() {
    if (this.gameOver) return;
    this.hasGameStarted = true;
    this.isMenuOpen = false;
    this.syncMenuText();
    this.alertTimer = this.alertEveryMs - 2000;
    if (this.startContainer) this.startContainer.setVisible(false);
    if (this.pauseContainer) this.pauseContainer.setVisible(false);
  }

  handleEscAction() {
    if (this.isTutorialOpen) {
      this.toggleTutorial(false);
      return;
    }
    if (this.currentQuiz || this.gameOver) return;
    if (!this.hasGameStarted) {
      this.isMenuOpen = !this.isMenuOpen;
      if (this.startContainer) this.startContainer.setVisible(this.isMenuOpen);
      return;
    }
    this.isMenuOpen = !this.isMenuOpen;
    if (this.pauseContainer) {
      this.pauseContainer.setVisible(this.isMenuOpen);
    }
  }

  createPlayer() {
    this.customPlayerReady = this.textures.exists("player-custom");
    this.usingCustomPlayer = this.customPlayerReady;
    this.player = this.add.image(1100, 624, this.usingCustomPlayer ? "player-custom" : "player-idle")
      .setScale(this.usingCustomPlayer ? 0.062 : 1.35)
      .setOrigin(0.5, this.usingCustomPlayer ? 0.72 : 0.5)
      .setDepth(50);
    this.cursors = this.input.keyboard.addKeys("W,A,S,D");
  }

  togglePlayerModel() {
    if (!this.player) return;
    if (!this.textures.exists("player-custom")) return;
    this.usingCustomPlayer = !this.usingCustomPlayer;
    if (this.usingCustomPlayer) {
      this.player.setTexture("player-custom").setScale(0.062).setOrigin(0.5, 0.72);
    } else {
      this.player.setTexture("player-idle").setScale(1.35).setDisplaySize(43, 43).setOrigin(0.5, 0.5);
    }
  }

  update(_, delta) {
    if (this.gameOver) return;
    if (!this.hasGameStarted || this.isMenuOpen) {
      this.updateUiTexts();
      return;
    }
    this.totalTime += delta;
    this.remainingMs -= delta;
    this.alertTimer += delta;
    this.handlePlayer(delta);
    this.updateTableStatuses();
    this.updateFlowDots(delta);
    this.updateProgress(delta);
    this.updateUiTexts();

    if (this.remainingMs <= 0) {
      this.finishGame();
      return;
    }

    if (!this.currentQuiz && !this.isTutorialOpen && !this.isMenuOpen && this.alertTimer >= this.alertEveryMs) {
      this.alertTimer = 0;
      this.spawnExclamation();
    }
  }

  handlePlayer(delta) {
    if (this.currentQuiz || this.isTutorialOpen || this.isMenuOpen) {
      return;
    }
    const speed = 0.22 * delta;
    const oldX = this.player.x;
    const oldY = this.player.y;
    let moving = false;
    if (this.cursors.A.isDown) {
      this.player.x -= speed;
      this.player.setFlipX(true);
      moving = true;
    }
    if (this.cursors.D.isDown) {
      this.player.x += speed;
      this.player.setFlipX(false);
      moving = true;
    }
    if (this.cursors.W.isDown) {
      this.player.y -= speed;
      moving = true;
    }
    if (this.cursors.S.isDown) {
      this.player.y += speed;
      moving = true;
    }

    if (moving) {
      this.walkFrameMs += delta;
      if (this.walkFrameMs > 150) {
        this.walkFrame = 1 - this.walkFrame;
        this.walkFrameMs = 0;
      }
      if (!this.usingCustomPlayer) {
        this.player.setTexture(this.walkFrame === 0 ? "player-walk-1" : "player-walk-2");
      } else {
        this.player.setTexture("player-custom").setScale(0.062).setOrigin(0.5, 0.72);
      }
    } else {
      this.walkFrameMs = 0;
      if (!this.usingCustomPlayer) {
        this.player.setTexture("player-idle");
      } else {
        this.player.setTexture("player-custom").setScale(0.062).setOrigin(0.5, 0.72);
      }
    }

    this.player.x = Phaser.Math.Clamp(this.player.x, OFFICE.x + 18, OFFICE.x + OFFICE.width - 18);
    this.player.y = Phaser.Math.Clamp(this.player.y, OFFICE.y + 18, OFFICE.y + OFFICE.height - 18);
    if (this.isPlayerBlockedByTable()) {
      this.player.x = oldX;
      this.player.y = oldY;
    }
  }

  isPlayerBlockedByTable() {
    const px = this.player.x;
    const py = this.player.y;
    const halfW = TABLE_W / 2 + 2;
    const halfH = TABLE_H / 2 + 2;
    return TABLES.some((table) => (
      px > table.x - halfW &&
      px < table.x + halfW &&
      py > table.y - halfH &&
      py < table.y + halfH
    ));
  }

  spawnExclamation() {
    const candidates = Array.from(this.tableState.values()).filter((t) => (
      t.status === "normal" &&
      t.alertCount < 3 &&
      !this.recentAlertTables.includes(t.id)
    ));
    if (!candidates.length) {
      this.recentAlertTables = this.recentAlertTables.slice(-2);
      const fallback = Array.from(this.tableState.values()).filter((t) => t.status === "normal" && t.alertCount < 3);
      if (!fallback.length) return;
      candidates.push(...fallback);
    }
    if (!candidates.length) return;
    const target = Phaser.Utils.Array.GetRandom(candidates);
    target.status = "warning";
    target.statusUntil = Number.POSITIVE_INFINITY;
    target.alertCount += 1;
    this.alertCountByTable[target.id] = target.alertCount;
    this.recentAlertTables.push(target.id);
    if (this.recentAlertTables.length > 4) {
      this.recentAlertTables.shift();
    }
    if (!target.exclamation) {
      target.exclamation = this.add.text(target.x, target.y - 90, "!", {
        fontSize: "44px",
        fontStyle: "bold",
        color: "#ef4444"
      }).setOrigin(0.5);
      this.tweens.add({
        targets: target.exclamation,
        scale: 1.16,
        yoyo: true,
        repeat: -1,
        duration: 380
      });
    }
    this.paintTable(target.id);
  }

  updateTableStatuses() {
    this.tableState.forEach((table) => {
      if (table.quizLocked) return;
      if (table.status === "cooldown" && this.time.now >= table.statusUntil) {
        table.status = "normal";
        if (table.exclamation) {
          table.exclamation.destroy();
          table.exclamation = null;
        }
        this.paintTable(table.id);
      }
    });
  }

  tryInteract() {
    if (this.currentQuiz || this.isTutorialOpen) return;
    const nearby = this.getClosestTable(85);
    if (!nearby) return;
    const state = this.tableState.get(nearby.id);
    if (state.status === "warning") {
      this.openQuiz(state.id);
    }
  }

  openQuiz(tableId) {
    const bankKey = this.getQuestionBankKey(tableId);
    const bank = this.resolveQuestionBank(bankKey);
    const question = this.pickQuestionForTable(tableId, bank);
    if (!question) return;
    const table = this.tableState.get(tableId);
    if (table) {
      table.quizLocked = true;
      table.status = "warning";
      table.statusUntil = Number.POSITIVE_INFINITY;
      this.paintTable(tableId);
    }
    this.currentQuiz = { tableId, question };
    this.quizAnswered = false;
    this.renderQuiz(question, (index) => {
      if (index === question.correct) {
        this.applyCorrectAnswer(tableId);
      } else {
        this.applyWrongAnswer(tableId, false);
      }
    });
  }

  renderQuiz(question, onSelect) {
    this.quizContainer.removeAll(true);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 560, 0x020617, 0.95)
      .setStrokeStyle(3, 0x60a5fa);
    const qText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 225, this.wrap(question.q, 82), {
      fontSize: "20px",
      color: "#f8fafc",
      align: "center",
      wordWrap: { width: 1020, useAdvancedWrap: true },
      lineSpacing: 4
    }).setOrigin(0.5);
    this.quizContainer.add([bg, qText]);

    let isAnswered = false;
    question.options.forEach((option, idx) => {
      const y = GAME_HEIGHT / 2 - 120 + idx * 82;
      const box = this.add.rectangle(GAME_WIDTH / 2, y, 1000, 64, 0x1e293b)
        .setStrokeStyle(2, 0x64748b)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(GAME_WIDTH / 2 - 476, y, `${idx + 1}. ${option}`, {
        fontSize: "16px",
        color: "#e2e8f0",
        align: "left",
        wordWrap: { width: 920, useAdvancedWrap: true },
        lineSpacing: 1
      }).setOrigin(0, 0.5);
      box.on("pointerover", () => box.setFillStyle(0x334155));
      box.on("pointerout", () => box.setFillStyle(0x1e293b));
      box.on("pointerdown", () => {
        if (isAnswered) return;
        isAnswered = true;
        const isCorrect = idx === question.correct;
        if (isCorrect) {
          box.setFillStyle(0x166534);
          box.setStrokeStyle(3, 0x22c55e);
        } else {
          box.setFillStyle(0x7f1d1d);
          box.setStrokeStyle(3, 0xef4444);
        }

        const children = this.quizContainer.list;
        children.forEach((node) => {
          if (node.input && node.disableInteractive) {
            node.disableInteractive();
          }
        });

        const correctY = GAME_HEIGHT / 2 - 120 + question.correct * 82;
        const correctMarker = this.add.text(GAME_WIDTH / 2 + 486, correctY, "OK", {
          fontSize: "18px",
          color: "#22c55e",
          fontStyle: "bold"
        }).setOrigin(0.5);
        this.quizContainer.add(correctMarker);

        onSelect(idx);
        this.quizAnswered = true;
        const feedback = this.add.text(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 + 222,
          isCorrect ? "Correct! The process returned to normal." : "Wrong answer! The desk entered cooldown.",
          {
            fontSize: "20px",
            color: isCorrect ? "#86efac" : "#fca5a5",
            fontStyle: "bold"
          }
        ).setOrigin(0.5);
        const closeButton = this.add.rectangle(GAME_WIDTH / 2 + 516, GAME_HEIGHT / 2 - 252, 42, 42, 0x7f1d1d)
          .setStrokeStyle(3, 0xfca5a5)
          .setInteractive({ useHandCursor: true });
        const closeText = this.add.text(GAME_WIDTH / 2 + 516, GAME_HEIGHT / 2 - 252, "X", {
          fontSize: "22px",
          color: "#fee2e2",
          fontStyle: "bold"
        }).setOrigin(0.5);
        closeButton.on("pointerdown", () => this.closeQuiz());
        this.quizContainer.add([feedback, closeButton, closeText]);
      });
      this.quizContainer.add([box, txt]);
    });

    const closeHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 246, "Select one option to continue.", {
      fontSize: "14px",
      color: "#94a3b8"
    }).setOrigin(0.5);
    this.quizContainer.add(closeHint);

    if (SHOW_CORRECT_ANSWER_DEBUG) {
      const debugAnswer = this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 210,
        `Test mode: correct answer = option ${question.correct + 1}`,
        { fontSize: "16px", color: "#fca5a5" }
      ).setOrigin(0.5);
      this.quizContainer.add(debugAnswer);
    }

    this.quizContainer.setVisible(true);
  }

  closeQuiz() {
    this.currentQuiz = null;
    this.quizAnswered = false;
    this.quizContainer.setVisible(false);
    this.quizContainer.removeAll(true);
  }

  closeAnsweredQuiz() {
    if (this.currentQuiz && this.quizAnswered) {
      this.closeQuiz();
    }
  }

  toggleTutorial(forceState) {
    this.isTutorialOpen = typeof forceState === "boolean" ? forceState : !this.isTutorialOpen;
    if (this.tutorialContainer) {
      this.tutorialContainer.setVisible(this.isTutorialOpen);
    }
  }

  applyCorrectAnswer(tableId) {
    const table = this.tableState.get(tableId);
    table.quizLocked = false;
    table.status = "normal";
    table.statusUntil = 0;
    if (table.exclamation) {
      table.exclamation.destroy();
      table.exclamation = null;
    }
    this.paintTable(tableId);
  }

  applyWrongAnswer(tableId, timeoutFail) {
    const table = this.tableState.get(tableId);
    table.quizLocked = false;
    table.status = "cooldown";
    table.statusUntil = this.time.now + this.cooldownMs;
    if (table.exclamation) {
      table.exclamation.destroy();
      table.exclamation = null;
    }
    this.paintTable(tableId);
  }

  pickQuestionForTable(tableId, bank) {
    if (!bank || bank.length === 0) {
      return DEFAULT_QUESTIONS.OT1.easy[0];
    }
    let candidates = bank;
    const historyKey = `${tableId}:${this.difficulty}`;
    const used = this.questionHistoryByTable[historyKey] || [];
    if (used.length < bank.length) {
      candidates = bank.filter((_, idx) => !used.includes(idx));
    } else {
      return null;
    }
    const selected = Phaser.Utils.Array.GetRandom(candidates);
    const selectedIndex = bank.indexOf(selected);
    this.lastQuestionByTable[tableId] = selectedIndex;
    this.questionHistoryByTable[historyKey] = [...used, selectedIndex];
    return this.shuffleQuestionOptions(selected);
  }

  getQuestionBankKey(tableId) {
    return tableId;
  }

  resolveQuestionBank(bankKey) {
    const bank = this.questionBank[bankKey] || DEFAULT_QUESTIONS[bankKey];
    if (Array.isArray(bank)) return bank;
    if (bank && Array.isArray(bank[this.difficulty])) return bank[this.difficulty];
    if (bank && Array.isArray(bank.medium)) return bank.medium;
    return [];
  }

  shuffleQuestionOptions(question) {
    const zipped = question.options.map((opt, idx) => ({
      text: opt,
      isCorrect: idx === question.correct
    }));
    Phaser.Utils.Array.Shuffle(zipped);
    return {
      q: question.q,
      options: zipped.map((x) => x.text),
      correct: zipped.findIndex((x) => x.isCorrect)
    };
  }

  getClosestTable(radius) {
    let closest = null;
    let bestDist = radius;
    TABLES.forEach((table) => {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, table.x, table.y);
      if (d < bestDist) {
        bestDist = d;
        closest = table;
      }
    });
    return closest;
  }

  getTableRate(tableId) {
    const table = this.tableState.get(tableId);
    let rate = table.baseRate;
    if (table.status === "warning") rate *= 0.45;
    if (table.status === "cooldown") rate *= 0.1;

    if (tableId === "DP3") {
      const dp1 = this.tableState.get("DP1");
      const dp2 = this.tableState.get("DP2");
      if (dp1.status !== "normal") rate *= 0.65;
      if (dp2.status !== "normal") rate *= 0.65;
    }
    if (tableId === "TMP2") {
      const dp4 = this.tableState.get("DP4");
      if (dp4.status !== "normal") rate *= 0.75;
    }
    return Phaser.Math.Clamp(rate, 0.05, 1.25);
  }

  redrawFlowLines() {
    this.flowLines.clear();
    FLOWS.forEach((flow) => {
      const from = this.tableState.get(flow.from);
      const to = this.tableState.get(flow.to);
      const edge = this.getFlowEndpoints(from, to);
      this.drawFlowLine(edge.fromX, edge.fromY, edge.toX, edge.toY, flow.type);
    });
  }

  drawFlowLine(fromX, fromY, toX, toY, type = "primary") {
    const color = type === "feedback" ? 0x5eead4 : 0x60a5fa;
    const texture = type === "feedback" ? 0x134e4a : 0x1e3a8a;
    this.flowLines.lineStyle(8, 0x020617, 0.5);
    this.flowLines.strokeLineShape(new Phaser.Geom.Line(fromX, fromY, toX, toY));
    this.flowLines.lineStyle(5, texture, 0.86);
    this.flowLines.strokeLineShape(new Phaser.Geom.Line(fromX, fromY, toX, toY));
    this.flowLines.lineStyle(2, color, 0.92);
    this.flowLines.strokeLineShape(new Phaser.Geom.Line(fromX, fromY, toX, toY));
    this.drawArrowHead(fromX, fromY, toX, toY, color, 0.95);
  }

  drawArrowHead(fromX, fromY, toX, toY, color, alpha) {
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    const size = 11;
    const left = angle + Math.PI - 0.55;
    const right = angle + Math.PI + 0.55;
    this.flowLines.fillStyle(color, alpha);
    this.flowLines.beginPath();
    this.flowLines.moveTo(toX, toY);
    this.flowLines.lineTo(toX + Math.cos(left) * size, toY + Math.sin(left) * size);
    this.flowLines.lineTo(toX + Math.cos(right) * size, toY + Math.sin(right) * size);
    this.flowLines.closePath();
    this.flowLines.fillPath();
  }

  updateFlowDots(delta) {
    const dt = delta / 1000;
    if (this.flowParticles.length === 0) {
      FLOWS.forEach((flow) => {
        this.flowParticles.push({ ...flow, t: Math.random() });
      });
    }
    this.flowDots.clear();
    this.flowParticles.forEach((p) => {
      const from = this.tableState.get(p.from);
      const to = this.tableState.get(p.to);
      const isBlocked = from.status !== "normal" || to.status !== "normal";
      const speed = isBlocked ? 0 : this.getTableRate(p.from) * 0.35;
      p.t = (p.t + dt * speed) % 1;
      const edge = this.getFlowEndpoints(from, to);
      const x = Phaser.Math.Interpolation.Linear([edge.fromX, edge.toX], p.t);
      const y = Phaser.Math.Interpolation.Linear([edge.fromY, edge.toY], p.t);
      this.drawPaperPacket(this.flowDots, x, y, isBlocked);
    });
  }

  drawPaperPacket(graphics, x, y, frozen = false) {
    graphics.fillStyle(frozen ? 0xfecaca : 0xf8fafc, 0.96);
    graphics.fillRect(x - 7, y - 5, 14, 10);
    graphics.fillStyle(frozen ? 0xef4444 : 0xfacc15, 0.95);
    graphics.fillRect(x - 7, y - 5, 14, 3);
    graphics.fillStyle(0x94a3b8, 0.9);
    graphics.fillRect(x - 3, y, 7, 1);
    graphics.fillRect(x - 3, y + 3, 5, 1);
  }

  getFlowEndpoints(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const halfW = TABLE_W / 2;
    const halfH = TABLE_H / 2;
    let fromX = from.x;
    let fromY = from.y;
    let toX = to.x;
    let toY = to.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      fromX = from.x + Math.sign(dx || 1) * halfW;
      toX = to.x - Math.sign(dx || 1) * halfW;
    } else {
      fromY = from.y + Math.sign(dy || 1) * halfH;
      toY = to.y - Math.sign(dy || 1) * halfH;
    }
    return { fromX, fromY, toX, toY };
  }

  updateProgress(delta) {
    const dt = delta / 1000;
    this.pv += dt * this.plannedRatePerSec;
    let totalRate = 0;
    TABLES.forEach((t) => {
      totalRate += this.getTableRate(t.id);
    });
    const normalized = totalRate / TABLES.length;
    const warnings = Array.from(this.tableState.values()).filter((t) => t.status === "warning").length;
    const cooldown = Array.from(this.tableState.values()).filter((t) => t.status === "cooldown").length;
    const issuePenalty = Phaser.Math.Clamp(1 - warnings * 0.14 - cooldown * 0.22, 0.28, 1);
    const healthyBoost = warnings === 0 && cooldown === 0 ? 1.2 : 1;
    const performanceFactor = Phaser.Math.Clamp(normalized * issuePenalty * healthyBoost, 0.25, 1.25);
    this.ev += dt * (this.plannedRatePerSec * performanceFactor * 1.3);
    this.ev = Phaser.Math.Clamp(this.ev, 0, 100);
    this.pv = Phaser.Math.Clamp(this.pv, 0, 100);

    this.evBar.width = Math.max(1, this.ev * 3.4);
    this.pvBar.width = Math.max(1, this.pv * 3.4);
  }

  updateUiTexts() {
    const diff = this.ev - this.pv;
    let label = "EV = PV (On plan)";
    let color = "#f8fafc";
    if (diff < -4) {
      label = "EV < PV (Project behind)";
      color = "#fca5a5";
    } else if (diff > 4) {
      label = "EV > PV (Project ahead)";
      color = "#86efac";
    }
    this.evPvText.setText(label);
    this.evPvText.setColor(color);
    this.timeText.setText(`Time ${Math.max(0, Math.ceil(this.remainingMs / 1000))}s`);
    this.difficultyText.setText(`Difficulty ${DIFFICULTIES[this.difficulty].label}`);

    const warnings = Array.from(this.tableState.values()).filter((t) => t.status === "warning").length;
    const cooldown = Array.from(this.tableState.values()).filter((t) => t.status === "cooldown").length;
    this.statusText.setText(`Warnings ${warnings} | Cooldowns ${cooldown}`);
  }

  setDifficulty(level) {
    const config = DIFFICULTIES[level];
    if (!config || this.gameOver) return;
    const changed = this.difficulty !== level;
    this.difficulty = level;
    this.alertEveryMs = config.alertEveryMs;
    this.warningMs = config.warningMs;
    this.cooldownMs = config.cooldownMs;
    this.updateDifficultyMenu();
    if (changed) {
      this.restartGame();
      this.updateDifficultyMenu();
    }
  }

  finishGame() {
    this.gameOver = true;
    this.remainingMs = 0;
    this.currentQuiz = null;
    this.quizContainer.setVisible(false);
    const diff = this.ev - this.pv;
    const passed = diff >= -6;
    const title = passed ? "MISSION COMPLETE" : "PROJECT BEHIND PLAN";
    const color = passed ? "#86efac" : "#fca5a5";
    const message = passed
      ? "Monitoring and control were managed well."
      : "EV is behind PV. Faster intervention is needed.";
    this.hasGameStarted = false;
    this.showEndPanel(title, message, color);
  }

  restartGame() {
    this.gameOver = false;
    this.remainingMs = this.gameDurationMs;
    this.ev = 0;
    this.pv = 0;
    this.alertTimer = 0;
    this.currentQuiz = null;
    this.lastQuestionByTable = {};
    this.questionHistoryByTable = {};
    this.recentAlertTables = [];
    this.alertCountByTable = {};
    this.hasGameStarted = false;
    this.isMenuOpen = true;

    if (this.quizContainer) {
      this.quizContainer.setVisible(false);
      this.quizContainer.removeAll(true);
    }
    if (this.endContainer) {
      this.endContainer.setVisible(false);
      this.endContainer.removeAll(true);
    }
    if (this.startContainer) {
      this.syncMenuText();
      this.startContainer.setVisible(true);
    }
    if (this.pauseContainer) {
      this.pauseContainer.setVisible(false);
    }

    this.tableState.forEach((table) => {
      table.status = "normal";
      table.statusUntil = 0;
      table.quizLocked = false;
      table.alertCount = 0;
      if (table.exclamation) {
        table.exclamation.destroy();
        table.exclamation = null;
      }
      this.paintTable(table.id);
    });
  }

  showEndPanel(title, message, color) {
    this.endContainer.removeAll(true);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 780, 380, 0x020617, 0.95)
      .setStrokeStyle(3, 0x38bdf8);
    const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, title, {
      fontSize: "26px",
      align: "center",
      color,
      fontStyle: "bold"
    }).setOrigin(0.5);
    const messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 35, message, {
      fontSize: "18px",
      align: "center",
      color,
      wordWrap: { width: 680, useAdvancedWrap: true }
    }).setOrigin(0.5);
    const statsText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 40,
      `EV: ${this.ev.toFixed(1)} | PV: ${this.pv.toFixed(1)}`,
      { fontSize: "30px", align: "center", color: "#e2e8f0" }
    ).setOrigin(0.5);
    const restartButton = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 135, 230, 54, 0x16a34a)
      .setStrokeStyle(3, 0x86efac)
      .setInteractive({ useHandCursor: true });
    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 135, "PLAY AGAIN", {
      fontFamily: FONT,
      fontSize: "22px",
      color: "#ecfdf5",
      fontStyle: "bold"
    }).setOrigin(0.5);
    restartButton.on("pointerover", () => restartButton.setFillStyle(0x15803d));
    restartButton.on("pointerout", () => restartButton.setFillStyle(0x16a34a));
    restartButton.on("pointerdown", () => this.restartGame());
    this.endContainer.add([bg, titleText, messageText, statsText, restartButton, restartText]);
    this.endContainer.setVisible(true);
  }

  paintTable(tableId) {
    const state = this.tableState.get(tableId);
    const graphics = this.tableGraphics.get(tableId);
    if (!state || !graphics) return;
    if (state.status === "normal") {
      graphics.g.setFillStyle(0x6b4423);
      graphics.g.setStrokeStyle(4, 0x2b170c);
      graphics.lip.setFillStyle(0x8b5a2b);
      graphics.monitor.setStrokeStyle(3, 0x38bdf8);
      graphics.screen.setFillStyle(0x164e63);
    } else if (state.status === "warning") {
      graphics.g.setFillStyle(0x7f2d20);
      graphics.g.setStrokeStyle(4, 0xef4444);
      graphics.lip.setFillStyle(0x7f1d1d);
      graphics.monitor.setStrokeStyle(3, 0xef4444);
      graphics.screen.setFillStyle(0x450a0a);
    } else {
      graphics.g.setFillStyle(0x5b4b2d);
      graphics.g.setStrokeStyle(4, 0xf59e0b);
      graphics.lip.setFillStyle(0x92400e);
      graphics.monitor.setStrokeStyle(3, 0xf59e0b);
      graphics.screen.setFillStyle(0x451a03);
    }
  }

  wrap(text, maxChars) {
    const words = text.split(" ");
    const lines = [];
    let current = "";
    words.forEach((w) => {
      const next = current.length ? `${current} ${w}` : w;
      if (next.length > maxChars) {
        lines.push(current);
        current = w;
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    return lines.join("\n");
  }
}

const gameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-root",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game-root",
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  scene: [OfficeScene]
};

new Phaser.Game(gameConfig);
