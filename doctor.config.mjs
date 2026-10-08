export default {
  ignore: {
    overrides: [
      {
        // The parent hook cancels both animation frames and disconnects the
        // item observer on unmount. The scanner misses this separate cleanup.
        files: ["src/hooks/use-fluid-hover.ts"],
        rules: ["react-doctor/effect-needs-cleanup"],
      },
    ],
  },
};
