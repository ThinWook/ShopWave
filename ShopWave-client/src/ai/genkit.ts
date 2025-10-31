// genkit.ts
// Gemini/GenKit integration has been disabled. Export a small stub so imports
// do not crash the runtime. If you need to re-enable AI later, restore the
// original implementation and ensure environment keys are set.

type AnyFunc = (...args: any[]) => any;

const disabled = () => {
  throw new Error('AI integration is disabled in this build. Gemini usage was removed.');
};

export const ai: {
  definePrompt: AnyFunc;
  defineFlow: AnyFunc;
  generate?: AnyFunc;
} = {
  definePrompt: disabled,
  defineFlow: disabled,
  generate: disabled,
};
