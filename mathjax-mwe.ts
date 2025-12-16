async function createMathHandler(config: {
    outputFormat?: "svg" | "chtml";
    font?: "newcm" | "fira";
    mathjax?: { load?: string[] };
}) {
    const { MathJax, combineConfig } = await import("@mathjax/src/js/components/global.js");

    //
    // Set the defaults for the configuration passed by the user
    //
    config = combineConfig(
        {
            outputFormat: "chtml",
            font: "newcm",
            mathjax: { load: [] },
        },
        config
    );

    //
    // Set the MathJax configuration defaults
    //
    combineConfig(MathJax.config, {
        loader: {
            load: [
                "input/tex",
                `output/${config.outputFormat}`,
                "adaptors/liteDOM",
                ...(config.mathjax?.load ?? []),
            ],
            paths: {
                mathjax: "@mathjax/src/bundle",
            },
            require: (file: string) => import(file),
        },
        startup: {
            document: "",
            typeset: false,
        },
        output: {
            font: `mathjax-${config.font}`,
        },
        chtml: {
            fontURL: `https://cdn.jsdelivr.net/npm/@mathjax/mathjax-${config.font}-font@latest/chtml/woff2`,
        },
    });

    //
    // Add MathJax configuration passed to us
    //
    combineConfig(MathJax.config, config.mathjax);

    //
    // Load MathJax and wait for it to start up
    //
    // @ts-expect-error
    await import("@mathjax/src/bundle/startup.js");
    // @ts-expect-error
    await MathJax.startup.promise;

    //
    // Create the MathJax commands and return them
    //
    // @ts-expect-error
    const processor = MathJax.startup.document;
    return {
        getCss: () => processor.adaptor.textContent(processor.outputJax.styleSheet(processor)),
        process: async (tex: string, options: object) => {
            const node = await processor.convertPromise(tex, options);
            return processor.adaptor.outerHTML(node).replace(/ data-latex=".*?"/g, "");
        },
    };
}

const { process: convert, getCss } = await createMathHandler({
    outputFormat: "svg",
    font: "fira",
    mathjax: {
        options: { enableAssistiveMml: true },
        load: ["centernot"],
        tex: { packages: { "[+]": ["centernot"] } },
    },
});

console.log(await convert("\\color{red}{x} \\centernot\\to", {}));
