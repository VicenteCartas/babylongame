import { ActionManager, Color3, CreateSoundAsync, ExecuteCodeAction, IAction, Mesh, MeshBuilder, Nullable, Scalar, Scene, StandardMaterial, StaticSound, Vector3 } from "@babylonjs/core";
import { BallInitialSpeed, BallState, IGameState, PlayerSide } from "../types";

// Represents the ball in the game
export class Ball {
    private _scene: Scene;
    private _mesh: Mesh | undefined;
    private _ballState: BallState;
    private _direction: Vector3; // Reuse the vector to avoid recreating it every update
    private _gameState: IGameState | undefined;
    private _bounces: number;
    private _hitSound: StaticSound | undefined;
    private _goalSound: StaticSound | undefined;
    private _leftPaddleAction: Nullable<IAction>;
    private _rightPaddleAction: Nullable<IAction>;

    public constructor (scene: Scene) {
        this._scene = scene;
        this._ballState = BallState.Middle;
        this._direction = Vector3.Zero();
        this._bounces = 0;
        this._leftPaddleAction = null;
        this._rightPaddleAction = null;
    }
    
    public get ballState() : BallState {
        return this._ballState;
    }

    public async load(state: IGameState): Promise<void> {
        this._gameState = state;
        this._mesh = MeshBuilder.CreateSphere('ball', {
            diameter: 0.5
        }, this._scene);
        this._mesh.position = new Vector3(0, 0.25, 0);
        const ballMaterial = new StandardMaterial('ballMaterial');
        ballMaterial.diffuseColor = Color3.Gray();
        this._mesh.material = ballMaterial;

        this._hitSound = await CreateSoundAsync("hit", "../hit.mp3");
        this._hitSound.volume = 0.2;
        this._goalSound = await CreateSoundAsync("goal", "../goal.mp3");
        this._goalSound.volume = 1;

        window.addEventListener('keydown', (ev) => {
            if (this._mesh) {
                if (ev.code === 'Space' && this._ballState !== BallState.Moving) {
                    const radians = Scalar.NormalizeRadians(Math.random() * 360.0);
                    this._direction.z = Math.sin(radians) * BallInitialSpeed;
                    
                    if (this._ballState === BallState.Middle){
                        this._direction.x = Math.cos(radians) * BallInitialSpeed;
                    }
                    if (this._ballState === BallState.Left) {
                        this._direction.x = Math.cos(radians) * BallInitialSpeed;
                        this._direction.x = Math.max(this._direction.x, this._direction.x * -1);
                    }
                    if (this._ballState === BallState.Right) {
                        this._direction.x = Math.cos(radians) * BallInitialSpeed;
                        this._direction.x = Math.min(this._direction.x, this._direction.x * -1);
                    }

                    this._ballState = BallState.Moving;
                }
            }
        });

        //Register events for the ball
        this._mesh.actionManager = new ActionManager(this._scene);
        this._mesh.actionManager.registerAction(new ExecuteCodeAction({
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: this._scene.getMeshByName("leftGoal")
        }, async () => {
            if (this._gameState) {
                this._goalSound?.play();
                await this._gameState.goalScored(PlayerSide.Right);
            }
        }, undefined));
        this._mesh.actionManager.registerAction(new ExecuteCodeAction({
            trigger: ActionManager.OnIntersectionEnterTrigger,
            parameter: this._scene.getMeshByName("rightGoal")
        }, async () => {
            if (this._gameState) {
                this._goalSound?.play();
                await this._gameState.goalScored(PlayerSide.Left);
            }
        }, undefined));

        this.registerPaddleActions();
    }

    // Paddle meshes can be recreated, so we ned to re-register the actions to calculate the collisions
    public registerPaddleActions(): void {
        if (this._mesh && this._mesh.actionManager) {
            if (this._leftPaddleAction) {
                this._mesh.actionManager.unregisterAction(this._leftPaddleAction);
            }

            if (this._rightPaddleAction) {
                this._mesh.actionManager.unregisterAction(this._rightPaddleAction);
            }

            this._leftPaddleAction = this._mesh.actionManager.registerAction(new ExecuteCodeAction({
                trigger: ActionManager.OnIntersectionEnterTrigger,
                parameter: this._scene.getMeshByName("leftPaddle")
            }, async () => {
                this._hitSound?.play();
                this._bounces++;
                this._direction.x *= -1 * (1 + this._bounces / 100);
            }, undefined));
            this._rightPaddleAction = this._mesh.actionManager.registerAction(new ExecuteCodeAction({
                trigger: ActionManager.OnIntersectionEnterTrigger,
                parameter: this._scene.getMeshByName("rightPaddle")
            }, async () => {
                this._hitSound?.play();
                this._bounces++;
                this._direction.x *= -1 * (1 + this._bounces / 100);
            }, undefined));
        }
    }

    public updateZ(newZ: number) : void {
        if (this._mesh) {
            this._mesh.position.z = newZ;
        }
    }

    public reset(sideScored: PlayerSide): void {
        if (this._mesh) {
            this._bounces = 0;
            this._direction.x = 0;
            this._direction.y = 0;
            this._direction.z = 0;
    
            if (sideScored === PlayerSide.Left) {
                this._ballState = BallState.Right;
                this._mesh.position.x = 8.249; // This is to avoid a "collision" on reset
                this._mesh.position.y = 0.25;
                this._mesh.position.z = 0;            
            } else {
                this._ballState = BallState.Left;
                this._mesh.position.x = -8.249; // This is to avoid a "collision" on reset
                this._mesh.position.y = 0.25;
                this._mesh.position.z = 0;   
            }
        }
    }

    // Function to run every game update
    public update(): void {
        if (this._ballState !== BallState.Moving) {
            return;
        }

        if (this._mesh) {
            this._mesh.moveWithCollisions(this._direction);

            // Bounce the wall if it "hits" the top or bottom borders
            if (this._mesh.position.z > 4.25) {
                this._mesh.position.z = 4.25;
                this._direction.z *= -1;
            }

            if (this._mesh.position.z < -4.25) {
                this._mesh.position.z = -4.25;
                this._direction.z *= -1;
            }
        }
    }
}

