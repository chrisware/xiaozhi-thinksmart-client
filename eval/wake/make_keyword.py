"""Turn a wake phrase into a keyword line for models/kws-en (gigaspeech BPE tokens, @label).

The KWS model hears sounds, not letters: its keywords are written in the BPE tokens it was
trained on. The training text was upper-cased first (see the model's keywords.txt), so this
upper-cases too; the @label keeps the phrase as the user says it on the page / config.

Needs sentencepiece (the model's bpe.model does the tokenising):

    uv run --no-project -p 3.12 --with sentencepiece python eval/wake/make_keyword.py "Hey Computer"

Prints one line, e.g.  ▁HE Y ▁COMP U TER @Hey_Computer — add it to wake_words in config.py.
(sherpa's keyword parser ends the label at a space, so the label writes _ for spaces.)
Check new phrases with eval/wake before shipping them: the model spots near sounds too.
"""
import argparse
import pathlib
import sys

import sentencepiece as spm

HERE = pathlib.Path(__file__).parent
MODEL = HERE.parent.parent / 'models' / 'kws-en' / 'bpe.model'

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('phrase', nargs='+', help='wake phrase, e.g. "Hey Computer"')
args = p.parse_args()
phrase = ' '.join(args.phrase)
if not MODEL.exists():
    sys.exit(f'missing {MODEL}: run make_keyword.py from the client checkout')
sp = spm.SentencePieceProcessor(model_file=str(MODEL))
tokens = sp.encode(phrase.upper(), out_type=str)
if any(t == '<unk>' for t in tokens):
    sys.exit(f'phrase does not tokenise cleanly: {tokens}')
print(' '.join(tokens) + ' @' + phrase.replace(' ', '_'))
