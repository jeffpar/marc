## MARC Experiments

### Setup

 1. Install [node with npm](https://nodejs.org/en/)
 2. Run `npm install`

### Example 1

To download and parse a MARC XML file from the LOC website, such as [https://lccn.loc.gov/2012939473/marcxml](https://lccn.loc.gov/2012939473/marcxml):

    `node marc.js https://lccn.loc.gov/2012939473/marcxml`

Output:

    requestURL(https://lccn.loc.gov/2012939473/marcxml)
    downloaded 5154 bytes
    parsing MARC as 'marcxml'
    read 1 record
    tag 245 old subField "a": "Robots, robots everywhere! /"
    tag 245 new subField "a": "Robots, robots everywhere!"
    tag 245 old subField "c": "by Sue Fliess ; illustrated by Bob Staake."
    tag 245 new subField "c": "by Sue Fliess ; illustrated by Bob Staake"
    tag 300 old subField "a": "1 v. (unpaged) :"
    tag 300 new subField "a": "1 v. (unpaged)"
    specify an output file to save modifications

Notes:

The program doesn't save the file locally unless you *also* specify an output filename; e.g.:

    `node marc.js https://lccn.loc.gov/2012939473/marcxml output/391520.mrc`

Alternatively, if you specify a barcode, an output file will be created using the barcode as the filename:

    `node marc.js https://lccn.loc.gov/2012939473/marcxml --barcode=391520`

And if you also want to view the contents of the entire MARC file, add `--text` to the command-line:

    `node marc.js https://lccn.loc.gov/2012939473/marcxml --barcode=391520 --text`

### Example 2

To read a previously downloaded MRC file, display its contents as "text", and then save the updated tags as a new file:

    `node marc.js input/391520.mrc --text output/391520.mrc`

Output:

    parsing MARC as 'iso2709'
    read 1 record
    LDR    01581cam a22003857a 4500
    001    17294606
    005    20151020125245.0
    008    120511s2013    nyua   j      000 1 eng d
    906    $a7$bcbc$ccopycat$d2$encip$f20$gy-gencatlg
    925 0  $aacquire$b1 shelf copy$xpolicy default
    925 1  $aacquire$b2 shelf copies$xpolicy default
    955    $apc17 2012-05-11$bxk07 2014-03-06 z-processor$ixk07 2014-03-10 (telework) c.1 to CALM$trk08 2014-04-29 copy 2 added
    010    $a  2012939473
    016 7  $a016453435$2Uk
    020    $a0449810798
    020    $a9780449810798
    035    $a(OCoLC)ocn818318095
    040    $aYDXCP$cYDXCP$dBTCTA$dBDX$dOCLCQ$dUKMGB$dIK2$dIEP$dUIU$dCGP$dFUG$dOCLCF$dDLC
    042    $alccopycat
    050 00 $aPZ8.3.F642$bRo 2013
    082 04 $a[E]$223
    100 1  $aFliess, Sue.
    245 10 $aRobots, robots everywhere! /$cby Sue Fliess ; illustrated by Bob Staake.
    260    $aNew York :$bGolden Books,$cc2013.
    300    $a1 v. (unpaged) :$bcol. ill. ;$c21 cm.
    490 1  $aA little golden book
    520    $aRhyming text explains all the things robots do, from exploring other planets to milking cows.
    650  0 $aRobots$vJuvenile fiction.
    650  0 $aStories in rhyme.
    650  0 $aPicture books for children.
    650  1 $aStories in rhyme.
    700 1  $aStaake, Bob,$d1957-,$eill.
    830  0 $aLittle golden books.
    856 42 $3Contributor biographical information$uhttp://www.loc.gov/catdir/enhancements/fy1601/2012939473-b.html
    856 42 $3Publisher description$uhttp://www.loc.gov/catdir/enhancements/fy1601/2012939473-d.html

    tag 245 old subField "a": "Robots, robots everywhere! /"
    tag 245 new subField "a": "Robots, robots everywhere!"
    tag 245 old subField "c": "by Sue Fliess ; illustrated by Bob Staake."
    tag 245 new subField "c": "by Sue Fliess ; illustrated by Bob Staake"
    tag 300 old subField "a": "1 v. (unpaged) :"
    tag 300 new subField "a": "1 v. (unpaged)"
    output/391520.mrc already exists

### Example 3

To search the LOC website for an ISBN:

    `node marc.js --isbn=9780449810798 --barcode=391520`

Output:

    requestURL(https://catalog.loc.gov/vwebv/searchAdvanced)
    requestURL(https://catalog.loc.gov/vwebv/search?searchArg1=9780449810798&argType1=all&searchCode1=KNUM&searchType=2&combine2=and&searchArg2=&argType2=all&searchCode2=GKEY&combine3=and&searchArg3=&argType3=all&searchCode3=GKEY&year=1519-2019&fromYear=&toYear=&location=all&place=all&type=all&language=all&recCount=25)
    title of search results: LC Catalog - Item Information (Full Record)
    found marcxml url: https://lccn.loc.gov/2012939473/marcxml
    parsing MARC as 'marcxml'
    read 1 record
    tag 245 old subField "a": "Robots, robots everywhere! /"
    tag 245 new subField "a": "Robots, robots everywhere!"
    tag 245 old subField "c": "by Sue Fliess ; illustrated by Bob Staake."
    tag 245 new subField "c": "by Sue Fliess ; illustrated by Bob Staake"
    tag 300 old subField "a": "1 v. (unpaged) :"
    tag 300 new subField "a": "1 v. (unpaged)"
    tag 020 del subField "a": "0449810798"
    tag 020 sav subField "a": "9780449810798"
    output/391520.mrc already exists

It the LOC website does not recognize an ISBN (as is often the case), instead of:

    title of search results: LC Catalog - Item Information (Full Record)

you'll see something else, such as:

    title of search results: LC Catalog - Advanced Search

or even a `System Error 404`.  In the case of a 404 error, try the command again, because the LOC web server
can be a bit finnicky, perhaps because the program is issuing requests too fast.  Note that each ISBN request
simulates what you would typically do in a web browser; i.e.:

 1. Go to [https://catalog.loc.gov/vwebv/searchAdvanced](https://catalog.loc.gov/vwebv/searchAdvanced)
 2. Enter an ISBN
 3. Select "LCCN-ISBN-ISSN (KNUM)"
 4. Click Search
 5. If a record is found, click "Save Record"
 6. Click "Save" to download the record as an .mrc file
