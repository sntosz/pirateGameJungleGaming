import { Container, Sprite, Graphics } from 'pixi.js';
import { TextureManager } from './TextureManager';

interface ParticleEffect {
  container: Container;
  lifetime: number;
  maxLifetime: number;
  update: (dt: number) => boolean;
}

export class EffectManager {
  public container: Container;
  private effects: ParticleEffect[] = [];

  constructor() {
    this.container = new Container();
  }

  public createExplosion(x: number, y: number, scale: number = 1.0): void {
    const c = new Container();
    c.position.set(x, y);

    const tex = TextureManager.getInstance().getTexture('explosion_effect');
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.scale.set(scale * 0.5);
    c.addChild(sprite);

    this.container.addChild(c);

    const effect: ParticleEffect = {
      container: c,
      lifetime: 0,
      maxLifetime: 0.4,
      update: (dt: number) => {
        effect.lifetime += dt;
        const progress = effect.lifetime / effect.maxLifetime;
        sprite.scale.set(scale * (0.5 + progress * 0.8));
        sprite.alpha = 1 - progress;
        return effect.lifetime < effect.maxLifetime;
      },
    };

    this.effects.push(effect);
  }

  public createWaterHit(x: number, y: number): void {
    const c = new Container();
    c.position.set(x, y);

    const g = new Graphics();
    c.addChild(g);
    this.container.addChild(c);

    const effect: ParticleEffect = {
      container: c,
      lifetime: 0,
      maxLifetime: 0.3,
      update: (dt: number) => {
        effect.lifetime += dt;
        const progress = effect.lifetime / effect.maxLifetime;
        g.clear();
        g.stroke({ width: 2, color: 0xffffff, alpha: 1 - progress });
        g.drawCircle(0, 0, 8 + progress * 16);
        return effect.lifetime < effect.maxLifetime;
      },
    };

    this.effects.push(effect);
  }

  public update(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      const alive = fx.update(dt);
      if (!alive) {
        if (fx.container.parent) {
          fx.container.parent.removeChild(fx.container);
        }
        fx.container.destroy({ children: true });
        this.effects.splice(i, 1);
      }
    }
  }

  public clear(): void {
    for (const fx of this.effects) {
      if (fx.container.parent) {
        fx.container.parent.removeChild(fx.container);
      }
      fx.container.destroy({ children: true });
    }
    this.effects = [];
  }
}
