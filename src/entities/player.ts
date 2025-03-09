import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { BallState, PaddleDirection, PlayerSpeed, PlayerSide, IGameState, IGameEntity } from "../types";

export type PlayerCreationOptions = {
    upKey: string;
    downKey: string;
    side: PlayerSide;
}

// Represents the first player in the game
export class Player implements IGameEntity {
    private _scene: Scene;
    private _loaded: boolean;
    private _options: PlayerCreationOptions
    private _mesh: Mesh | undefined;
    private _moveDirection: PaddleDirection;
    private _movementVector: Vector3; // Reuse the vector to avoid recreating it every update
    private _state: IGameState | undefined;
    private _modifiers: number[];
    private _currentModifier: number;
    private _paddleSize: number;

    public constructor (scene: Scene, options: PlayerCreationOptions) {
        this._scene = scene;
        this._options = options;
        this._loaded = false;
        this._moveDirection = PaddleDirection.None;
        this._movementVector = Vector3.Zero();
        this._modifiers = [0.5, 1, 2];
        this._currentModifier = 1;
        this._paddleSize = 2;
    }

    public async load(state: IGameState): Promise<void> {
        if (this._loaded) {
            return;
        }

        this._state = state;
        
        this.createPaddle();

        window.addEventListener('keydown', (ev) => {
            if (ev.code === this._options.upKey) {
                this._moveDirection = PaddleDirection.Up;
            }

            if (ev.code === this._options.downKey) {
                this._moveDirection = PaddleDirection.Down;
            }
        });

        window.addEventListener('keyup', (ev) => {
            if (ev.code === this._options.upKey || ev.code === this._options.downKey) {
                this._moveDirection = PaddleDirection.None;
            }
        });

        window.addEventListener('keydown', (ev) => {
            if (ev.code === 'Digit1' && this._options.side === PlayerSide.Left) {
                this._currentModifier = (this._currentModifier + 1) % this._modifiers.length;
                this.createPaddle();
                this._state?.gameBall?.registerPaddleActions();
            }

            if (ev.code === 'Digit2' && this._options.side === PlayerSide.Right) {
                this._currentModifier = (this._currentModifier + 1) % this._modifiers.length;
                this.createPaddle();
                this._state?.gameBall?.registerPaddleActions();
            }
        });

        this._loaded = true;
    }

    public reset(): void {
        if (this._mesh) {
            this._moveDirection = PaddleDirection.None;
            this._movementVector.z = 0;
            const xPosition = this._options.side === PlayerSide.Left ? -8.75 : 8.75;
            this._mesh.position = new Vector3(xPosition, 0.25, 0);
        }
    }

    // Function to run every game update
    public update(): void {
        switch (this._moveDirection) {
            case PaddleDirection.None:
                this._movementVector.z = 0
                break;
            case PaddleDirection.Up:
                this._movementVector.z = PlayerSpeed;
                break;
            case PaddleDirection.Down:
                this._movementVector.z = -PlayerSpeed
                break;
        }

        if (this._mesh) {
            this._mesh.moveWithCollisions(this._movementVector);
            if (this._mesh.position.z > 4.5 - (0.5 * this._paddleSize * this._modifiers[this._currentModifier])) {
                this._mesh.position.z = 4.5 - (0.5 * this._paddleSize * this._modifiers[this._currentModifier]);
            }

            if (this._mesh.position.z < -4.5 + (0.5 * this._paddleSize * this._modifiers[this._currentModifier])) {
                this._mesh.position.z = -4.5 + (0.5 * this._paddleSize * this._modifiers[this._currentModifier]);
            }

            if (this._options.side === PlayerSide.Left && this._state?.gameBall?.ballState === BallState.Left) {
                this._state.gameBall.updateZ(this._mesh.position.z);
            }

            if (this._options.side === PlayerSide.Right && this._state?.gameBall?.ballState === BallState.Right) {
                this._state.gameBall.updateZ(this._mesh.position.z);
            }
        }
    }

    public dispose(): void {
        this._mesh?.dispose();
        this._loaded = false;
    }

    private createPaddle(): void {
        let zPosition = 0;
        if (this._mesh) {
            zPosition = this._mesh.position.z;
            this._mesh.dispose();
        }

        const name = this._options.side === PlayerSide.Left ? 'leftPaddle' : 'rightPaddle';
        this._mesh = MeshBuilder.CreateBox(
            name, {
                width: 0.5,
                height: 0.5,
                depth: this._paddleSize * this._modifiers[this._currentModifier]
            },
            this._scene);

        const xPosition = this._options.side === PlayerSide.Left ? -8.75 : 8.75;
        this._mesh.position = new Vector3(xPosition, 0.25, zPosition);
        const paddleMaterial = new StandardMaterial('paddleMaterial');
        paddleMaterial.diffuseColor = this._options.side === PlayerSide.Left ? Color3.Red() : Color3.Blue();
        this._mesh.material = paddleMaterial;
    }
}