// Legacy prompts remain for open older clients and historical tickets.
// The new studio uses the six SHADE_TREATMENTS defined below.
export const PROMPTS={
 clareamento:`Whiten only the visible tooth enamel to a bright, natural ivory-white appearance, using #FFF8F0 as a shade reference rather than a flat color. Preserve the original shape, size, position, alignment, edges, spacing, and number of teeth exactly. Maintain natural enamel texture, translucency, shadows, and highlights. Do not reshape, straighten, enlarge, or reconstruct teeth. Do not alter the gums, lips, skin, facial features, expression, framing, lighting, or any area outside the tooth enamel. Avoid artificial glow, clipped highlights, and a uniform opaque white appearance. Do not upscale or enhance the overall image.`,
 lentes:`Apply the best veneers to the upper and lower teeth in shade white`
};

// Explicit keys: treatment order in the UI or in a gallery never selects a prompt.
export const TREATMENT_PROMPTS=Object.freeze({
 clareamento:Object.freeze({id:'clareamento-bl1-v1',name:'Clareamento',model:'qwen-image-2.1',prompt:PROMPTS.clareamento}),
 lentes:Object.freeze({id:'lentes-bl1-v1',name:'Lentes',model:'qwen-image-2.1',prompt:PROMPTS.lentes})
});

export const SHADE_REFERENCES=Object.freeze({BL1:'#FFF8F0',BL2:'#FAF1E7',A1:'#F3E5DC'});
const whiteningTail=' as a shade reference rather than a flat color. Preserve the original shape, size, position, alignment, edges, spacing, and number of teeth exactly. Maintain natural enamel texture, translucency, shadows, and highlights. Do not reshape, straighten, enlarge, or reconstruct teeth. Do not alter the gums, lips, skin, facial features, expression, framing, lighting, or any area outside the tooth enamel. Avoid artificial glow, clipped highlights, and a uniform opaque white appearance. Do not upscale or enhance the overall image.';
export const SHADE_TREATMENTS=Object.freeze(Object.fromEntries(['clareamento','lentes'].map(procedure=>[procedure,Object.freeze(Object.fromEntries(Object.entries(SHADE_REFERENCES).map(([shade,color])=>[shade,Object.freeze({id:`${procedure}-${shade.toLowerCase()}-v2`,name:procedure==='lentes'?'Lentes':'Clareamento',model:'qwen-image-2.1',shade,prompt:procedure==='lentes'?`Apply the best veneers to the upper and lower teeth in shade ${shade} ${color}`:`Whiten only the visible tooth enamel to a bright, natural ivory-white appearance, using ${shade} ${color}`+whiteningTail})])))])));
