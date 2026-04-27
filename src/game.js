const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const TABLES = [
  { id: "OT1", label: "OT1", fullName: "Develop Organizational Test Specification", layer: "organizational", x: 170, y: 120, baseRate: 1.0 },
  { id: "OT3", label: "OT3", fullName: "Update Organizational Test Specification", layer: "organizational", x: 400, y: 120, baseRate: 1.0 },
  { id: "TMP1", label: "TMP1", fullName: "Test Strategy and Planning", layer: "management", x: 190, y: 330, baseRate: 1.0 },
  { id: "TMP2", label: "TMP2", fullName: "Test Monitoring and Control", layer: "management", x: 430, y: 330, baseRate: 1.1 },
  { id: "TMP3", label: "TMP3", fullName: "Test Completion", layer: "management", x: 670, y: 330, baseRate: 1.0 },
  { id: "DP1", label: "DP1", fullName: "Test Design and Implementation", layer: "dynamic", x: 220, y: 560, baseRate: 1.0 },
  { id: "DP2", label: "DP2", fullName: "Test Environment and Data Management", layer: "dynamic", x: 460, y: 560, baseRate: 1.0 },
  { id: "DP3", label: "DP3", fullName: "Test Execution", layer: "dynamic", x: 700, y: 560, baseRate: 1.0 },
  { id: "DP4", label: "DP4", fullName: "Test Incident Reporting", layer: "dynamic", x: 940, y: 560, baseRate: 1.0 }
];

const FLOWS = [
  { from: "OT1", to: "OT3" },
  { from: "TMP1", to: "TMP2", bidirectional: true },
  { from: "TMP2", to: "TMP3", bidirectional: true },
  { from: "DP1", to: "DP3" },
  { from: "DP2", to: "DP3" },
  { from: "DP3", to: "DP4" },
  { from: "DP4", to: "TMP2" },
  { from: "DP4", to: "OT3" },
  { from: "TMP2", to: "TMP1" },
  { from: "TMP2", to: "DP1" },
  { from: "TMP2", to: "DP2" },
  { from: "TMP2", to: "DP3" }
];

const DEFAULT_QUESTIONS = {
  OT1: [{ q: "OT1’in temel amacı nedir?", options: ["Organizasyon seviyesinde test yaklaşımını tanımlamak", "Yalnızca test execution yapmak", "Sadece incident kaydetmek"], correct: 0 }],
  OT3: [{ q: "OT3 neyi temsil eder?", options: ["Organizasyonel test spesifikasyonunu güncellemeyi", "Yalnızca test ortamı kurmayı", "Plan dışı deployment yapmayı"], correct: 0 }],
  TMP1: [{ q: "TMP1’in odağı nedir?", options: ["Planlama ve strateji", "Sadece kod yazma", "Sadece bug kapatma"], correct: 0 }],
  TMP2: [{ q: "TMP2’nin kritik görevi hangisi?", options: ["Planlanan ve gerçekleşen ilerlemeyi izlemek ve kontrol etmek", "Yalnızca test case yazmak", "Sadece rapor basmak"], correct: 0 }],
  TMP3: [{ q: "TMP3 sürecinde ne beklenir?", options: ["Test kapanış aktiviteleri ve sonuçların tamamlanması", "Yeni test stratejisi başlatmak", "Ortam kurulumu yapmak"], correct: 0 }],
  DP1: [{ q: "DP1, DP3’ü neden etkiler?", options: ["Design/implementation çıktıları execution’ı besler", "Hiçbir bağlantı yoktur", "Execution, design’dan önce gelir"], correct: 0 }],
  DP2: [{ q: "DP2’nin ana katkısı nedir?", options: ["Test environment ve data yönetimi sağlamak", "Sadece rapor yazmak", "Sadece plan barını artırmak"], correct: 0 }],
  DP3: [{ q: "DP3 hangi süreci temsil eder?", options: ["Test execution", "Organizasyon güncelleme", "Kapanış yönetimi"], correct: 0 }],
  DP4: [{ q: "DP4’den TMP2’ye giden geri bildirim neyi sağlar?", options: ["Monitoring ve corrective control için bilgi sağlar", "Akışı tamamen yok sayar", "PV barını durdurur"], correct: 0 }]
};

const DIFFICULTIES = {
  easy: { label: "Easy", alertEveryMs: 5200, warningMs: 9000, cooldownMs: 5200 },
  medium: { label: "Medium", alertEveryMs: 4200, warningMs: 7600, cooldownMs: 6800 },
  hard: { label: "Hard", alertEveryMs: 3200, warningMs: 6200, cooldownMs: 8200 }
};

const SHOW_CORRECT_ANSWER_DEBUG = true;

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
    this.score = 0;
    this.questionBank = DEFAULT_QUESTIONS;
    this.gameDurationMs = 180000;
    this.remainingMs = this.gameDurationMs;
    this.plannedRatePerSec = 100 / (this.gameDurationMs / 1000);
    this.hasGameStarted = false;
    this.gameOver = false;
    this.gameResultText = "";
    this.lastQuestionByTable = {};
  }

  preload() {
    this.load.json("questions", "./src/questions.json");
  }

  create() {
    const loadedQuestions = this.cache.json.get("questions");
    if (loadedQuestions) {
      this.questionBank = loadedQuestions;
    }
    this.cameras.main.setBackgroundColor("#0b1020");
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
    this.input.keyboard.on("keydown-ESC", () => this.handleEscAction());
  }

  drawLayers() {
    const layerStyle = { fontSize: "20px", color: "#93c5fd", fontStyle: "bold" };
    this.add.text(40, 45, "Organizational Layer", layerStyle);
    this.add.text(40, 255, "Test Management Layer", layerStyle);
    this.add.text(40, 485, "Dynamic Test Processes Layer", layerStyle);

    const line = this.add.graphics({ lineStyle: { width: 2, color: 0x334155 } });
    line.lineBetween(30, 210, GAME_WIDTH - 30, 210);
    line.lineBetween(30, 440, GAME_WIDTH - 30, 440);
  }

  createTables() {
    TABLES.forEach((table) => {
      this.tableState.set(table.id, {
        ...table,
        status: "normal",
        statusUntil: 0,
        exclamation: null
      });

      const g = this.add.rectangle(table.x, table.y, 180, 72, 0x1f2937).setStrokeStyle(2, 0x60a5fa);
      const shortLabel = this.add.text(table.x, table.y - 14, table.label, {
        fontSize: "18px",
        color: "#e2e8f0",
        fontStyle: "bold"
      }).setOrigin(0.5);
      const longLabel = this.add.text(table.x, table.y + 12, this.wrap(table.fullName, 20), {
        fontSize: "11px",
        color: "#cbd5e1",
        align: "center"
      }).setOrigin(0.5);
      this.tableGraphics.set(table.id, { g, shortLabel, longLabel });
    });
  }

  createFlows() {
    this.flowLines = this.add.graphics();
    this.flowDots = this.add.graphics();
    this.flowLines.setDepth(-5);
    this.flowDots.setDepth(-4);
    this.redrawFlowLines();
  }

  createUI() {
    this.hintText = this.add.text(920, 90, "WASD: Move\nE: Interact\nH: Help\n1/2/3: Difficulty", {
      fontSize: "16px",
      color: "#f8fafc",
      backgroundColor: "#0f172a",
      padding: { x: 10, y: 8 }
    });

    this.scoreText = this.add.text(920, 165, "Score: 0", {
      fontSize: "20px",
      color: "#a7f3d0",
      fontStyle: "bold"
    });

    this.statusText = this.add.text(920, 205, "Status: Running", {
      fontSize: "16px",
      color: "#cbd5e1"
    });
    this.timeText = this.add.text(920, 235, "Time: 180s", {
      fontSize: "16px",
      color: "#fde68a"
    });

    this.evBarBg = this.add.rectangle(930, 295, 300, 20, 0x334155).setOrigin(0, 0.5);
    this.evBar = this.add.rectangle(930, 295, 1, 20, 0x22c55e).setOrigin(0, 0.5);
    this.pvBarBg = this.add.rectangle(930, 355, 300, 20, 0x334155).setOrigin(0, 0.5);
    this.pvBar = this.add.rectangle(930, 355, 1, 20, 0x3b82f6).setOrigin(0, 0.5);

    this.add.text(930, 264, "EV (Earned Value)", { fontSize: "14px", color: "#86efac" });
    this.add.text(930, 324, "PV (Planned Value)", { fontSize: "14px", color: "#93c5fd" });
    this.evPvText = this.add.text(930, 390, "EV = PV", { fontSize: "16px", color: "#f8fafc" });
    this.difficultyText = this.add.text(930, 420, "Difficulty: Medium", {
      fontSize: "16px",
      color: "#c4b5fd"
    });

    this.exitButton = this.add.rectangle(1215, 34, 110, 42, 0x7f1d1d)
      .setStrokeStyle(2, 0xfca5a5)
      .setDepth(1300)
      .setInteractive({ useHandCursor: true });
    this.exitButtonText = this.add.text(1215, 34, "EXIT", {
      fontSize: "20px",
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
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 175, "Kucuk Demo: Nasil Oynanir?", {
      fontSize: "36px",
      color: "#f8fafc",
      fontStyle: "bold"
    }).setOrigin(0.5);

    const body = this.add.text(
      GAME_WIDTH / 2 - 420,
      GAME_HEIGHT / 2 - 112,
      [
        "1) WASD ile ofiste gez.",
        "2) Masanin ustunde ! gorursen o masa yavasliyor demektir.",
        "3) Masaya yaklasip E tusuna bas ve soruyu ac.",
        "4) Dogru cevap: masa normale doner, EV toparlar.",
        "5) Yanlis/gec cevap: masa cooldown olur, bagli akislar yavaslar.",
        "",
        "Hedef: EV barini PV'den cok geride birakma."
      ].join("\n"),
      {
        fontSize: "18px",
        color: "#dbeafe",
        align: "left",
        lineSpacing: 12,
        wordWrap: { width: 840, useAdvancedWrap: true }
      }
    );

    const closeHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 185, "Kapat: H veya ESC", {
      fontSize: "18px",
      color: "#93c5fd"
    }).setOrigin(0.5);

    this.tutorialContainer.add([bg, title, body, closeHint]);
  }

  createStartOverlay() {
    this.startContainer = this.add.container(0, 0).setDepth(1400).setVisible(true);

    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 980, 520, 0x020617, 0.96)
      .setStrokeStyle(3, 0x22d3ee);
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 205, "Process Panic: Test Office", {
      fontSize: "44px",
      color: "#e2e8f0",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 158, "Kisa Demo + Baslangic", {
      fontSize: "22px",
      color: "#93c5fd"
    }).setOrigin(0.5);
    const body = this.add.text(
      GAME_WIDTH / 2 - 430,
      GAME_HEIGHT / 2 - 105,
      [
        "• Masalarda ! cikarsa surec yavaslar.",
        "• Masaya gidip E ile soruyu ac, dogru cevapla akisi toparla.",
        "• Yanlis/gec cevap cooldown olusturur, EV duser.",
        "• H ile yardim panelini her zaman acabilirsin."
      ].join("\n"),
      { fontSize: "20px", color: "#dbeafe", lineSpacing: 14, wordWrap: { width: 860, useAdvancedWrap: true } }
    );

    const button = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, 260, 68, 0x16a34a)
      .setStrokeStyle(3, 0x86efac)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 150, "START", {
      fontSize: "30px",
      color: "#ecfdf5",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 220, "Enter / Space ile de baslatabilirsin", {
      fontSize: "18px",
      color: "#94a3b8"
    }).setOrigin(0.5);

    button.on("pointerover", () => button.setFillStyle(0x15803d));
    button.on("pointerout", () => button.setFillStyle(0x16a34a));
    button.on("pointerdown", () => this.startGame());

    this.startContainer.add([bg, title, subtitle, body, button, buttonText, hint]);
  }

  startGame() {
    if (this.hasGameStarted || this.gameOver) return;
    this.hasGameStarted = true;
    this.alertTimer = 0;
    if (this.startContainer) this.startContainer.setVisible(false);
  }

  handleEscAction() {
    if (this.isTutorialOpen) {
      this.toggleTutorial(false);
    }
  }

  createPlayer() {
    this.player = this.add.rectangle(1080, 590, 28, 28, 0xf59e0b).setStrokeStyle(2, 0xfde68a);
    this.cursors = this.input.keyboard.addKeys("W,A,S,D");
  }

  update(_, delta) {
    if (this.gameOver) return;
    if (!this.hasGameStarted) {
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

    if (!this.currentQuiz && !this.isTutorialOpen && this.alertTimer >= this.alertEveryMs) {
      this.alertTimer = 0;
      this.spawnExclamation();
    }
  }

  handlePlayer(delta) {
    if (this.currentQuiz || this.isTutorialOpen) {
      return;
    }
    const speed = 0.22 * delta;
    if (this.cursors.A.isDown) this.player.x -= speed;
    if (this.cursors.D.isDown) this.player.x += speed;
    if (this.cursors.W.isDown) this.player.y -= speed;
    if (this.cursors.S.isDown) this.player.y += speed;

    this.player.x = Phaser.Math.Clamp(this.player.x, 20, GAME_WIDTH - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, 20, GAME_HEIGHT - 20);
  }

  spawnExclamation() {
    const candidates = Array.from(this.tableState.values()).filter((t) => t.status === "normal");
    if (!candidates.length) return;
    const target = Phaser.Utils.Array.GetRandom(candidates);
    target.status = "warning";
    target.statusUntil = this.time.now + this.warningMs;
    if (!target.exclamation) {
      target.exclamation = this.add.text(target.x, target.y - 58, "!", {
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
      if (table.status === "warning" && this.time.now >= table.statusUntil) {
        this.applyWrongAnswer(table.id, true);
      }
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
    const bank = this.questionBank[tableId] || DEFAULT_QUESTIONS[tableId];
    const question = this.pickQuestionForTable(tableId, bank);
    this.currentQuiz = { tableId, question };
    this.renderQuiz(question, (index) => {
      if (index === question.correct) {
        this.applyCorrectAnswer(tableId);
      } else {
        this.applyWrongAnswer(tableId, false);
      }
      this.closeQuiz();
    });
  }

  renderQuiz(question, onSelect) {
    this.quizContainer.removeAll(true);
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 920, 460, 0x020617, 0.95)
      .setStrokeStyle(3, 0x60a5fa);
    const qText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, this.wrap(question.q, 66), {
      fontSize: "22px",
      color: "#f8fafc",
      align: "center"
    }).setOrigin(0.5);
    this.quizContainer.add([bg, qText]);

    let isAnswered = false;
    question.options.forEach((option, idx) => {
      const y = GAME_HEIGHT / 2 - 50 + idx * 96;
      const box = this.add.rectangle(GAME_WIDTH / 2, y, 780, 74, 0x1e293b)
        .setStrokeStyle(2, 0x64748b)
        .setInteractive({ useHandCursor: true });
      const txt = this.add.text(GAME_WIDTH / 2 - 372, y, `${idx + 1}) ${option}`, {
        fontSize: "18px",
        color: "#e2e8f0",
        align: "left",
        wordWrap: { width: 730, useAdvancedWrap: true },
        lineSpacing: 2
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

        const correctY = GAME_HEIGHT / 2 - 50 + question.correct * 96;
        const correctMarker = this.add.text(GAME_WIDTH / 2 + 382, correctY, "✓", {
          fontSize: "30px",
          color: "#22c55e",
          fontStyle: "bold"
        }).setOrigin(0.5);
        this.quizContainer.add(correctMarker);

        this.time.delayedCall(550, () => onSelect(idx));
      });
      this.quizContainer.add([box, txt]);
    });

    const closeHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 186, "Bir secenek secerek devam et.", {
      fontSize: "14px",
      color: "#94a3b8"
    }).setOrigin(0.5);
    this.quizContainer.add(closeHint);

    if (SHOW_CORRECT_ANSWER_DEBUG) {
      const debugAnswer = this.add.text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 210,
        `Test modu: Dogru cevap = ${question.correct + 1}. sik`,
        { fontSize: "16px", color: "#fca5a5" }
      ).setOrigin(0.5);
      this.quizContainer.add(debugAnswer);
    }

    this.quizContainer.setVisible(true);
  }

  closeQuiz() {
    this.currentQuiz = null;
    this.quizContainer.setVisible(false);
    this.quizContainer.removeAll(true);
  }

  toggleTutorial(forceState) {
    this.isTutorialOpen = typeof forceState === "boolean" ? forceState : !this.isTutorialOpen;
    if (this.tutorialContainer) {
      this.tutorialContainer.setVisible(this.isTutorialOpen);
    }
  }

  applyCorrectAnswer(tableId) {
    const table = this.tableState.get(tableId);
    table.status = "normal";
    table.statusUntil = 0;
    if (table.exclamation) {
      table.exclamation.destroy();
      table.exclamation = null;
    }
    this.score += 10;
    this.paintTable(tableId);
  }

  applyWrongAnswer(tableId, timeoutFail) {
    const table = this.tableState.get(tableId);
    table.status = "cooldown";
    table.statusUntil = this.time.now + this.cooldownMs;
    this.score -= timeoutFail ? 7 : 5;
    this.paintTable(tableId);
  }

  pickQuestionForTable(tableId, bank) {
    if (!bank || bank.length === 0) {
      return DEFAULT_QUESTIONS[tableId][0];
    }
    let candidates = bank;
    const last = this.lastQuestionByTable[tableId];
    if (bank.length > 1 && typeof last === "number") {
      candidates = bank.filter((_, idx) => idx !== last);
    }
    const selected = Phaser.Utils.Array.GetRandom(candidates);
    const selectedIndex = bank.indexOf(selected);
    this.lastQuestionByTable[tableId] = selectedIndex;
    return this.shuffleQuestionOptions(selected);
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
      this.flowLines.lineStyle(1.6, 0x334155, 0.52);
      this.flowLines.strokeLineShape(new Phaser.Geom.Line(edge.fromX, edge.fromY, edge.toX, edge.toY));
      if (flow.bidirectional) {
        const reverseEdge = this.getFlowEndpoints(to, from);
        this.flowLines.lineStyle(1.2, 0x334155, 0.38);
        this.flowLines.strokeLineShape(
          new Phaser.Geom.Line(reverseEdge.fromX + 4, reverseEdge.fromY + 4, reverseEdge.toX + 4, reverseEdge.toY + 4)
        );
      }
    });
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
      const speed = this.getTableRate(p.from) * 0.35;
      p.t += dt * speed;
      if (p.t > 1) p.t -= 1;
      const from = this.tableState.get(p.from);
      const to = this.tableState.get(p.to);
      const edge = this.getFlowEndpoints(from, to);
      const x = Phaser.Math.Interpolation.Linear([edge.fromX, edge.toX], p.t);
      const y = Phaser.Math.Interpolation.Linear([edge.fromY, edge.toY], p.t);
      this.flowDots.fillStyle(0x67e8f9, 0.72);
      this.flowDots.fillCircle(x, y, 3);
    });
  }

  getFlowEndpoints(from, to) {
    const halfW = 90;
    const halfH = 36;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const fromX = from.x + Phaser.Math.Clamp(dx, -halfW, halfW);
    const fromY = from.y + Phaser.Math.Clamp(dy, -halfH, halfH);
    const toX = to.x - Phaser.Math.Clamp(dx, -halfW, halfW);
    const toY = to.y - Phaser.Math.Clamp(dy, -halfH, halfH);
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
    const issuePenalty = Phaser.Math.Clamp(1 - warnings * 0.06 - cooldown * 0.11, 0.35, 1);
    const performanceFactor = Phaser.Math.Clamp(normalized * issuePenalty, 0.3, 1.25);
    this.ev += dt * (this.plannedRatePerSec * performanceFactor);
    this.ev = Phaser.Math.Clamp(this.ev, 0, 100);
    this.pv = Phaser.Math.Clamp(this.pv, 0, 100);

    this.evBar.width = Math.max(1, this.ev * 3);
    this.pvBar.width = Math.max(1, this.pv * 3);
  }

  updateUiTexts() {
    this.scoreText.setText(`Score: ${this.score}`);
    const diff = this.ev - this.pv;
    let label = "EV = PV (Plana uygun)";
    let color = "#f8fafc";
    if (diff < -4) {
      label = "EV < PV (Proje geride)";
      color = "#fca5a5";
    } else if (diff > 4) {
      label = "EV > PV (Proje onde)";
      color = "#86efac";
    }
    this.evPvText.setText(label);
    this.evPvText.setColor(color);
    this.timeText.setText(`Time: ${Math.max(0, Math.ceil(this.remainingMs / 1000))}s`);
    this.difficultyText.setText(`Difficulty: ${DIFFICULTIES[this.difficulty].label}`);

    const warnings = Array.from(this.tableState.values()).filter((t) => t.status === "warning").length;
    const cooldown = Array.from(this.tableState.values()).filter((t) => t.status === "cooldown").length;
    this.statusText.setText(`Status: Warning ${warnings} | Cooldown ${cooldown}`);
  }

  setDifficulty(level) {
    const config = DIFFICULTIES[level];
    if (!config || this.gameOver) return;
    this.difficulty = level;
    this.alertEveryMs = config.alertEveryMs;
    this.warningMs = config.warningMs;
    this.cooldownMs = config.cooldownMs;
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
      ? "Monitoring and control iyi yonetildi."
      : "EV, PV'nin gerisinde. Daha hizli mudahale gerekli.";
    this.hasGameStarted = false;
    this.showEndPanel(title, message, color);
  }

  restartGame() {
    this.gameOver = false;
    this.remainingMs = this.gameDurationMs;
    this.ev = 0;
    this.pv = 0;
    this.score = 0;
    this.alertTimer = 0;
    this.currentQuiz = null;
    this.lastQuestionByTable = {};
    this.hasGameStarted = false;

    if (this.quizContainer) {
      this.quizContainer.setVisible(false);
      this.quizContainer.removeAll(true);
    }
    if (this.endContainer) {
      this.endContainer.setVisible(false);
      this.endContainer.removeAll(true);
    }
    if (this.startContainer) {
      this.startContainer.setVisible(true);
    }

    this.tableState.forEach((table) => {
      table.status = "normal";
      table.statusUntil = 0;
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
      `Final Score: ${this.score}\nEV: ${this.ev.toFixed(1)} | PV: ${this.pv.toFixed(1)}`,
      { fontSize: "30px", align: "center", color: "#e2e8f0" }
    ).setOrigin(0.5);
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 135, "Sayfayi yenileyerek yeniden baslatabilirsin.", {
      fontSize: "18px",
      color: "#93c5fd"
    }).setOrigin(0.5);
    this.endContainer.add([bg, titleText, messageText, statsText, hint]);
    this.endContainer.setVisible(true);
  }

  paintTable(tableId) {
    const state = this.tableState.get(tableId);
    const graphics = this.tableGraphics.get(tableId);
    if (!state || !graphics) return;
    if (state.status === "normal") {
      graphics.g.setFillStyle(0x1f2937);
      graphics.g.setStrokeStyle(2, 0x60a5fa);
    } else if (state.status === "warning") {
      graphics.g.setFillStyle(0x3f1d1d);
      graphics.g.setStrokeStyle(3, 0xef4444);
    } else {
      graphics.g.setFillStyle(0x3f3f46);
      graphics.g.setStrokeStyle(3, 0xf59e0b);
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
  scene: [OfficeScene]
};

new Phaser.Game(gameConfig);
