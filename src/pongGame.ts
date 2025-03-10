import { Color4, CreateSoundAsync, CreateStreamingSoundAsync, DirectionalLight, Engine, FreeCamera, HavokPlugin, Scene, StaticSound, StreamingSound, TextureBlock, UniversalCamera, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, Grid, StackPanel, TextBlock, Image } from "@babylonjs/gui";
import { PongTable } from "./entities/pongTable";
import { Player } from "./entities/player";
import { Ball } from "./entities/ball";
import { PlayerSide, IGameState, GameState, IGameScene } from "./types";
import HavokPhysics from "@babylonjs/havok";
import { StartGameScene } from "./scenes/startGameScene";
import { EndGameScene } from "./scenes/endGameScene";

export class PongGame implements IGameState {
    private _engine: Engine;
    private canvas: HTMLCanvasElement;
    private _activeScene: Scene | undefined;
    private environment: PongTable | undefined;
    private leftPlayer: Player | undefined;
    private rightPlayer: Player | undefined;
    public gameBall: Ball | undefined;
    public leftPlayerScore: number;
    public rightPlayerScore: number;
    private leftScoreTextBox: TextBlock;
    private rightScoreTextBox: TextBlock;
    private _backgroundMusic: StreamingSound | undefined;
    private _startSound: StaticSound | undefined;
    private _activeGameScene: IGameScene | undefined;
    private _scenes: IGameScene[];

    public constructor(engine: Engine, canvas: HTMLCanvasElement) {
        this._engine = engine;
        this.canvas = canvas;
        this.leftPlayerScore = 0;
        this.rightPlayerScore = 0;
        this.leftScoreTextBox = new TextBlock('leftScore', this.leftPlayerScore.toString());
        this.rightScoreTextBox = new TextBlock('rightScore', this.rightPlayerScore.toString());

        this._scenes = new Array(3);
        this._scenes[GameState.Start] = new StartGameScene(this._engine);
        //this._scenes[GameState.Play] = new PlayGameScene(this.engine);
        this._scenes[GameState.End] = new EndGameScene(this._engine);
    }

    public get activeScene(): Scene | undefined {
        return this._activeScene;
    }

    // State functions
    public async startState(): Promise<void> {
        this._engine.displayLoadingUI();

        // Stop inputs while loading on the current scene
        this._activeScene?.detachControl();

        // The new scene for the Start state
        const scene = new Scene(this._engine);
        scene.clearColor = new Color4(0.15, 0.15, 0.15, 1);
        const camera = new FreeCamera('guiCamera', Vector3.Zero(), scene);
        camera.setTarget(Vector3.Zero());

        // Music
        this._backgroundMusic = await CreateStreamingSoundAsync("intro", "../music.mp3", { autoplay: true, loop: true});

        // Create GUI
        const startUI = AdvancedDynamicTexture.CreateFullscreenUI('startUI');
        startUI.idealHeight = 1024;

        const stack = new StackPanel('splashStack');
        stack.isVertical = true;
        stack.height = '50%';
        stack.width = '100%';
        stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        startUI.addControl(stack);

        const splash = new Image('splash', '../splash.png');
        splash.width = '800px';
        splash.height = '215px';
        splash.stretch = Image.STRETCH_NONE;
        stack.addControl(splash);

        const playButton = Button.CreateSimpleButton('playButton', 'Play');
        playButton.width = 0.2;
        playButton.height = '40px';
        playButton.color = 'white';
        playButton.background = 'gray'
        playButton.cornerRadius = 5;
        playButton.fontSize = 25;
        playButton.onPointerDownObservable.add(async () => {
            await this.playButtonClicked(scene);
        });
        stack.addControl(playButton);

        // Loading complete
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();

        // Swap scenes
        this._activeScene?.dispose();
        this._activeScene = scene;
    }

    private async gameState(): Promise<void> {
        // Initial state
        this._backgroundMusic?.stop();
        this.leftPlayerScore = 0;
        this.rightPlayerScore = 0;
        this.leftScoreTextBox.text = this.leftPlayerScore.toString();
        this.rightScoreTextBox.text = this.rightPlayerScore.toString();

        this._engine.displayLoadingUI();

        // Stop inputs while loading on the current scene
        this._activeScene?.detachControl();

        // The new scene for the Game state
        const scene = new Scene(this._engine);
        scene.clearColor = new Color4(0.15, 0.15, 0.15, 1);
        const light = new DirectionalLight('globalLight', new Vector3(0, -1, 0), scene);
        light.intensity = 0.7;
        const camera = new UniversalCamera('gameCamera', new Vector3(0, 16, 0.5), scene);
        camera.setTarget(new Vector3(0, 0, 0.5));
        camera.rotation.y = 0;
        // camera.attachControl(); // For debugging if needed
        // camera.inputs.addMouseWheel();

        // Music
        this._startSound = await CreateSoundAsync("start", "../start.mp3", { autoplay: true });

        // Create GUI
        const gameUI = AdvancedDynamicTexture.CreateFullscreenUI('gameUI');
        gameUI.idealHeight = 1024;

        const topPanel = new Grid('topPanel');
        topPanel
            .addColumnDefinition(0.5, false)
            .addColumnDefinition(0.5, false)
            .addRowDefinition(0.5, false)
            .addRowDefinition(0.5, false);

        topPanel.height = '80px';
        topPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        topPanel.background = 'white';
        gameUI.addControl(topPanel);

        this.leftScoreTextBox.width = '100%';
        this.leftScoreTextBox.height = '40px';
        this.leftScoreTextBox.color = 'red';
        this.leftScoreTextBox.fontSize = 25;
        this.leftScoreTextBox.fontWeight = 'bold';
        topPanel.addControl(this.leftScoreTextBox, 0, 0);

        this.rightScoreTextBox.width = '100%';
        this.rightScoreTextBox.height = '40px';
        this.rightScoreTextBox.color = 'blue';
        this.rightScoreTextBox.fontSize = 25;
        this.rightScoreTextBox.fontWeight = 'bold';
        topPanel.addControl(this.rightScoreTextBox, 0, 1);

        const leftInstructionsTextBox = new TextBlock('leftInstructions', 'W/S to move paddel, Space to shoot, 1 to change paddle size');
        leftInstructionsTextBox.width = '100%';
        leftInstructionsTextBox.height = '40px';
        leftInstructionsTextBox.color = 'red';
        leftInstructionsTextBox.fontSize = 20;
        topPanel.addControl(leftInstructionsTextBox, 1, 0);
        
        const rightInstructionsTextBox = new TextBlock('rightInstructions', 'Up/Down to move paddel, Space to shoot, 2 to change paddle size');
        rightInstructionsTextBox.width = '100%';
        rightInstructionsTextBox.height = '40px';
        rightInstructionsTextBox.color = 'blue';
        rightInstructionsTextBox.fontSize = 20;
        topPanel.addControl(rightInstructionsTextBox, 1, 1);

        // Load the game table
        this.environment = new PongTable(scene);
        this.environment.load(this);

        // Create the players
        this.leftPlayer = new Player(scene, { upKey: 'KeyW', downKey: 'KeyS', side: PlayerSide.Left});
        this.leftPlayer.load(this);
        this.rightPlayer = new Player(scene, { upKey: 'ArrowUp', downKey: 'ArrowDown', side: PlayerSide.Right});
        this.rightPlayer.load(this);

        // Create the ball
        this.gameBall = new Ball(scene);
        await this.gameBall.load(this);
        
        scene.beforeRender = () => {
            this.leftPlayer?.update();
            this.rightPlayer?.update();
            this.gameBall?.update();
        }

        // Loading complete
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();

        // Swap scenes
        this._activeScene?.dispose();
        this._activeScene = scene;
    }

    private async endState(endOfGameText: string): Promise<void> {
        this._engine.displayLoadingUI();

        // Stop inputs while loading on the current scene
        this._activeScene?.detachControl();
        
        // The new scene for the Start state
        const scene = new Scene(this._engine);
        scene.clearColor = new Color4(0.15, 0.15, 0.15, 1);
        const camera = new FreeCamera('guiCamera', Vector3.Zero(), scene);
        camera.setTarget(Vector3.Zero());

        // Create the GUI
        const loseUI = AdvancedDynamicTexture.CreateFullscreenUI('loseUI');
        loseUI.idealHeight = 1024;

        const mainMenuButton = Button.CreateSimpleButton('mainMenuButton', endOfGameText);
        mainMenuButton.width = 0.3;
        mainMenuButton.height = '40px';
        mainMenuButton.color = 'white';
        mainMenuButton.background = 'gray'
        mainMenuButton.cornerRadius = 5;
        mainMenuButton.fontSize = 25;
        mainMenuButton.onPointerDownObservable.add(() => {
            this.mainMenuButtonClicked(scene);
        });
        loseUI.addControl(mainMenuButton);

        // Loading complete
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();

        // Swap scenes
        this._activeScene?.dispose();
        this._activeScene = scene;
    }

    // GUI Functions
    private async playButtonClicked(scene: Scene) {
        await this.gameState();
        scene.detachControl();
    }

    private mainMenuButtonClicked(scene: Scene) {
        this.startState();
        scene.detachControl();
    }

    public async goalScored(sideScored: PlayerSide): Promise<void> {
        this.leftPlayer?.reset();
        this.rightPlayer?.reset();
        this.gameBall?.reset(sideScored);
        if (sideScored === PlayerSide.Left) {
            this.leftPlayerScore++;
            this.leftScoreTextBox.text = this.leftPlayerScore.toString();
            if (this.leftPlayerScore >= 3) {
                await this.endState(`Left player won ${this.leftPlayerScore}-${this.rightPlayerScore}. Go to main menu`)
            }
        } else {
            this.rightPlayerScore++;
            this.rightScoreTextBox.text = this.rightPlayerScore.toString();
            if (this.rightPlayerScore >= 3) {
                await this.endState(`Right player won ${this.leftPlayerScore}-${this.rightPlayerScore}. Go to main menu`)
            }
        }
    }

    public get activeGameScene(): IGameScene | undefined {
        return this._activeGameScene;
    }

    public async goToState(state: GameState): Promise<void> {
        // Deactivate the current scene
        //this._activeGameScene?.deactivate();

        // Load and activate the new scene
        this._activeGameScene = this._scenes[state];
        await this._activeGameScene.load(this);
        this._activeGameScene.activate();
    }
}