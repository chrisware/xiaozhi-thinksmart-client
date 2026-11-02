---
frameworks:
- 其他
license: Apache License 2.0
tasks:
- keyword-spotting
---

English keyword-spotting model for sherpa-onnx, trained on GigaSpeech XL (10 000 hours of
English speech), 3.3 M parameters, BPE modelling unit. Zipformer trained with icefall and
converted to onnx; the same architecture as `models/kws-zh` (wenetspeech, pinyin tokens), so
`thinksmart_client/kws.py` uses it unchanged — only the keyword lines differ.

Fetched from https://github.com/k2-fsa/sherpa-onnx/releases/tag/kws-models, archive
`sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01.tar.bz2` (upstream: pkufool,
Apache-2.0). The three epoch files were renamed to encoder.onnx / decoder.onnx / joiner.onnx
as in kws-zh; int8 variants and the test wavs were left out. `bpe.model` stays so new
keywords can be made without downloading anything else (see below).

Keyword lines are BPE tokens of the upper-cased phrase, then `@` and the phrase as spoken;
sherpa's keyword parser ends the label at a space, so spaces are written `_`:

    ▁HE Y ▁COMP U TER @Hey_Computer

Generate them with `eval/wake/make_keyword.py` (it runs the BPE with sentencepiece):

    uv run --no-project -p 3.12 --with sentencepiece python eval/wake/make_keyword.py "Hey Computer"

The model matches sounds, not spelling: test any new phrase against confusable speech with
`eval/wake/run.py --lang en` before adding it (see the README there).
