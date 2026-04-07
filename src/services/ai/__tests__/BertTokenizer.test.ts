import { BertTokenizer } from '../BertTokenizer';

describe('BertTokenizer', () => {
  let tokenizer: BertTokenizer;
  const sampleVocab = `unused1
unused2
[PAD]
[CLS]
[SEP]
[MASK]
[UNK]
the
a
and
of
to
in
is
you
that
it
he
was
for
on
are
as
with
his
they
I
at
be
this
have
from
or
one
had
by
word
but
not
what
all
were
we
when
your
can
said
there
use
an
each
which
she
do
how
their
if
will
up
other
about
out
many
then
them
these
so
some
her
would
make
like
into
him
has
two
more
very
after
words
its
just
where
most
get
through
back
much
go
good
new
write
our
me
man
too
any
day
same
right
look
think
also
around
another
came
come
work
three
must
because
does
part
even
place
well
such
here
take
why
things
help
put
years
different
away
again
off
went
old
number
great
tell
men
say
small
every
found
still
between
name
should
home
big
give
air
line
set
own
under
read
last
never
us
left
end
along
while
might
next
sound
below
saw
something
thought
both
few
those
always
show
large
often
together
asked
house
don't
world
going
want
school
important
until
form
food
keep
children
feet
land
side
without
boy
once
animal
life
enough
took
sometimes
four
head
above
kind
begin
almost
live
page
got
told
usually
didn't
certainly
##a
##b
##c
##d
##e
##f
##g
##h
##i
##j
##k
##l
##m
##n
##o
##p
##q
##r
##s
##t
##u
##v
##w
##x
##y
##z
##th
##he
##in
##er
##an
##re
##on
##at
##en
##nd
##ti
##es
##or
##te
##of
##ed
##is
##it
##al
##ar
##st
##to
##nt
##ng
##se
##ha
##as
##ou
##io
##le
##ve
##co
##me
##de
##hi
##ri
##ro
##ic
##ne
##ea
##ra
##ce
##li
##ch
##ll
##be
##ma
##si
##om
##ur
`;

  beforeEach(() => {
    tokenizer = new BertTokenizer(52);
  });

  describe('loadFromString', () => {
    test('should load vocab from string', () => {
      tokenizer.loadFromString(sampleVocab);
      expect(tokenizer.isLoaded()).toBe(true);
      expect(tokenizer.getVocabSize()).toBeGreaterThan(100);
    });
  });

  describe('encode', () => {
    beforeEach(() => {
      tokenizer.loadFromString(sampleVocab);
    });

    test('should encode simple text', () => {
      const encoded = tokenizer.encode('the');
      expect(encoded).toBeInstanceOf(BigInt64Array);
      expect(encoded.length).toBe(52);
      expect(Number(encoded[0])).toBe(101);
      expect(Number(encoded[encoded.length - 1])).toBe(0);
    });

    test('should encode text with multiple words', () => {
      const encoded = tokenizer.encode('the cat sat');
      expect(encoded).toBeInstanceOf(BigInt64Array);
      expect(encoded.length).toBe(52);
      expect(Number(encoded[0])).toBe(101);
    });

    test('should encode empty text', () => {
      const encoded = tokenizer.encode('');
      expect(encoded.length).toBe(52);
      expect(Number(encoded[0])).toBe(101);
      expect(Number(encoded[1])).toBe(102);
    });

    test('should truncate long text', () => {
      const longText = 'a '.repeat(100);
      const encoded = tokenizer.encode(longText);
      expect(encoded.length).toBe(52);
    });
  });

  describe('createAttentionMask', () => {
    beforeEach(() => {
      tokenizer.loadFromString(sampleVocab);
    });

    test('should create attention mask', () => {
      const encoded = tokenizer.encode('the cat');
      const mask = tokenizer.createAttentionMask(encoded);
      expect(mask).toBeInstanceOf(BigInt64Array);
      expect(mask.length).toBe(52);
      expect(Number(mask[0])).toBe(1);
      expect(Number(mask[1])).toBe(1);
      expect(Number(mask[2])).toBe(1);
    });
  });

  describe('decode', () => {
    beforeEach(() => {
      tokenizer.loadFromString(sampleVocab);
    });

    test('should decode token ids back to text', () => {
      const original = 'the cat';
      const encoded = tokenizer.encode(original);
      const tokenIds: number[] = [];
      for (let i = 0; i < encoded.length; i++) {
        tokenIds.push(Number(encoded[i]));
      }
      const decoded = tokenizer.decode(tokenIds);
      expect(decoded).toBeTruthy();
    });
  });

  describe('error handling', () => {
    test('should throw if not loaded', () => {
      expect(() => tokenizer.encode('test')).toThrow('Tokenizer not loaded');
    });
  });

  describe('preprocessText', () => {
    beforeEach(() => {
      tokenizer.loadFromString(sampleVocab);
    });

    test('should handle mixed case', () => {
      const encoded1 = tokenizer.encode('THE');
      const encoded2 = tokenizer.encode('the');
      expect(encoded1[1]).toEqual(encoded2[1]);
    });

    test('should handle extra spaces', () => {
      const encoded = tokenizer.encode('  the   cat  ');
      expect(encoded.length).toBe(52);
      expect(Number(encoded[0])).toBe(101);
    });
  });
});
