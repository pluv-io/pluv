import type { Texture } from "pixi.js";

interface DropletShader {
    uniforms: {
        iResolution: {
            type: string;
            value: [number, number];
        };
        vTextureSize: {
            type: string;
            value: [number, number];
        };
        uTextureForeground: {
            type: string;
            value: null | Texture;
        };
        uTextureBackground: {
            type: string;
            value: null | Texture;
        };
        uTextureDropShine: {
            type: string;
            value: null | Texture;
        };
    };
    fragment: string;
}

export const dropletShader: DropletShader = {
    uniforms: {
        iResolution: {
            type: "v2",
            value: [0, 0],
        },
        vTextureSize: {
            type: "v2",
            value: [0, 0],
        },
        uTextureForeground: {
            type: "sampler2D",
            value: null,
        },
        uTextureBackground: {
            type: "sampler2D",
            value: null,
        },
        uTextureDropShine: {
            type: "sampler2D",
            value: null,
        },
    },
    fragment: `
        precision mediump float;
        
        uniform sampler2D uTextureForeground;
        uniform sampler2D uTextureBackground;
        uniform sampler2D uTextureDropShine;
        
        uniform sampler2D uSampler;

        uniform vec2 iResolution;
        uniform vec2 vTextureSize;
        varying vec2 vTextureCoord;
        
        vec2 texCoord(){
            return vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y) / iResolution;
        }

        vec2 scaledTextureCoordinate() {
            float ratioCanvas = iResolution.x / iResolution.y;
            float ratioImage = vTextureSize.x / vTextureSize.y;
            
            vec2 scale = vec2(1, 1);
            vec2 offset = vec2(0, 0);
            float ratioDelta = ratioCanvas - ratioImage;

            if(ratioDelta >= 0.0) {
                scale.y = (1.0 + ratioDelta);
                offset.y = ratioDelta / 2.0;
            } else {
                scale.x = (1.0 - ratioDelta);
                offset.x = -(ratioDelta / 2.0);
            }

            return (texCoord() + offset) / scale;
        }
        
        vec4 blend(vec4 bg, vec4 fg) {
            vec3 bgm = bg.rgb * bg.a;
            vec3 fgm = fg.rgb * fg.a;
            float ia = 1.0 - fg.a;
            float a = (fg.a + bg.a * ia);
            
            vec3 rgb;
            
            if (a != 0.0) {
                rgb = (fgm + bgm * ia) / a;
            } else {
                rgb = vec3(0.0, 0.0, 0.0);
            }
            
            return vec4(rgb,a);
        }
        
        vec2 pixel(){
            return vec2(1.0, 1.0) / iResolution;
        }
        
        vec4 fgColor(){
            return texture2D(uSampler, vTextureCoord);
        }
                
        void main(){
            vec4 bg = texture2D(uTextureBackground, scaledTextureCoordinate());
            vec4 cur = fgColor();

            float d = cur.b; // "thickness"
            float x = cur.g;
            float y = cur.r;
            float a = smoothstep(0.65, 0.7, cur.a);
            
            vec4 smoothstepped = vec4(y, x, d, a);

            vec2 refraction = (vec2(x, y) - 0.5) * 2.0;
            vec2 refractionPos = scaledTextureCoordinate() + (pixel() * refraction * (256.0 + (d * 512.0)));
            vec4 tex = texture2D(uTextureForeground, refractionPos);
            
            float maxShine = 390.0;
            float minShine = maxShine * 0.18;
            vec2 shinePos = vec2(0.5, 0.5) + ((1.0 / 512.0) * refraction) * -(minShine + ((maxShine-minShine) * d));
            vec4 shine = texture2D(uTextureDropShine, shinePos);
            tex = blend(tex, shine);
            
            vec4 fg = vec4(tex.rgb, a);
            gl_FragColor = blend(bg, fg);
        }
    `,
};
