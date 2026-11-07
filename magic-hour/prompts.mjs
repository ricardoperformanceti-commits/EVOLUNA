// Approved with the clinic. Both AI treatments start in BL1; other shades are local edits.
export const PROMPTS={
 clareamento:`Whiten only the visible tooth enamel to a bright, natural ivory-white appearance, using #FFF8F0 as a shade reference rather than a flat color. Preserve the original shape, size, position, alignment, edges, spacing, and number of teeth exactly. Maintain natural enamel texture, translucency, shadows, and highlights. Do not reshape, straighten, enlarge, or reconstruct teeth. Do not alter the gums, lips, skin, facial features, expression, framing, lighting, or any area outside the tooth enamel. Avoid artificial glow, clipped highlights, and a uniform opaque white appearance. Do not upscale or enhance the overall image.`,
 lentes:`Apply the best veneers to the upper and lower teeth in shade bl1`
};

// Explicit keys: treatment order in the UI or in a gallery never selects a prompt.
export const TREATMENT_PROMPTS=Object.freeze({
 clareamento:Object.freeze({id:'clareamento-bl1-v1',name:'Clareamento',prompt:PROMPTS.clareamento}),
 lentes:Object.freeze({id:'lentes-bl1-v1',name:'Lentes',prompt:PROMPTS.lentes})
});
