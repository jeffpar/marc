## MARC Experiments

### Quick Setup

 1. Install [node with npm](https://nodejs.org/en/) and [git](https://git-scm.com/downloads)
 2. Clone the project: `git clone https://github.com/jeffpar/marc.git`
 3. `cd` into your new `marc` directory and run `npm install`
 4. Test it: `node marc.js` should display usage instructions

### Installing Node on Windows (The Hard Way)

When you don't have Administrator privileges:

 1. From a CMD prompt, make a `nodejs` directory in `C:\ProgramData\Applications` (`mkdir nodejs`)
 2. From [https://nodejs.org/dist/v12.13.1/win-x64/](https://nodejs.org/dist/v12.13.1/win-x64/), download `node.exe` into `C:\ProgramData\Applications\nodejs`
 3. In Control Panel, search for "Environment", click "Edit environment variables for your account", select Path, click New, and add **C:\ProgramData\Applications\nodejs**
 4. Download [https://registry.npmjs.org/npm/-/npm-6.13.1.tgz](https://registry.npmjs.org/npm/-/npm-6.13.1.tgz) and unpack it with a free tool like ZipExtractor into `C:\ProgramData\Applications\npm-6.13.1`
 5. From a CMD prompt, in the `C:\ProgramData\Applications\npm-6.13.1\package` directory, run `node bin/npm-cli.js install npm -gf`
 6. Verify that `node -v` and `npm -v` display their respective version numbers

## Examples

NOTE: The following examples assume you're running a batch file or script (e.g., `marc.cmd`) that in turn runs `node marc.js` (or `node --tls-min-v1.0 marc.js` to help resolve SSL compatibility issues).

### Example 1

To download and parse a MARC XML file from the LOC website, such as [https://lccn.loc.gov/2012939473/marcxml](https://lccn.loc.gov/2012939473/marcxml):

    marc https://lccn.loc.gov/2012939473/marcxml

Output:

    requestURL(https://lccn.loc.gov/2012939473/marcxml)
    downloaded 5154 bytes
    parsing MARC as 'marcxml'
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
    tweaks:
    tag 245 old subField "a": "Robots, robots everywhere! /"
    tag 245 new subField "a": "Robots, robots everywhere!"
    tag 245 old subField "c": "by Sue Fliess ; illustrated by Bob Staake."
    tag 245 new subField "c": "by Sue Fliess ; illustrated by Bob Staake"
    tag 300 old subField "a": "1 v. (unpaged) :"
    tag 300 new subField "a": "1 v. (unpaged)"
    tag 020 sav subField "a": "0449810798"
    tag 020 sav subField "a": "9780449810798"
    specify an output file to save the above tweaks

Notes:

The program doesn't save the file locally unless you *also* specify an output filename; e.g.:

    marc https://lccn.loc.gov/2012939473/marcxml output/391520.mrc

Alternatively, if you specify a barcode, an output file will be created using the barcode as the filename:

    marc https://lccn.loc.gov/2012939473/marcxml barcode:391520

And if you also want to view the contents of the entire MARC file, add `text` to the command-line:

    marc https://lccn.loc.gov/2012939473/marcxml barcode:391520 text

### Example 2

To read a previously downloaded MRC file, display its contents as "text", and then save the updated tags as a new file:

    marc input/391520.mrc text output/391520.mrc

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
    tweaks:
    tag 245 old subField "a": "Robots, robots everywhere! /"
    tag 245 new subField "a": "Robots, robots everywhere!"
    tag 245 old subField "c": "by Sue Fliess ; illustrated by Bob Staake."
    tag 245 new subField "c": "by Sue Fliess ; illustrated by Bob Staake"
    tag 300 old subField "a": "1 v. (unpaged) :"
    tag 300 new subField "a": "1 v. (unpaged)"
    output/391520.mrc already exists

### Example 3

To search the LOC website for an ISBN:

    marc isbn:9780449810798 barcode:391520

Output:

    requestURL(https://catalog.loc.gov/vwebv/searchAdvanced)
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

### Example 4

To search the LOC website by LCCN (Library of Congress Catalog/Control Number):

    marc lccn:2014397535 isbn:0062287516

Output:

    requestURL(https://catalog.loc.gov/vwebv/searchAdvanced)
    title of search results: LC Catalog - Item Information (Full Record)
    found marcxml url: https://lccn.loc.gov/2014397535/marcxml
    parsing MARC as 'marcxml'
    read 1 record
    LDR    01957cam a22004457i 4500
    001    18156003
    005    20140529153114.0
    008    140519s2013    nyua   j      000 1 eng d
    906    $a7$bcbc$ccopycat$d2$encip$f20$gy-gencatlg
    925 0  $aacquire$b1 shelf copies$xpolicy default
    955    $bxn02 2014-05-19 z-processor$ixk12 2014-05-29 (telework) c. 1 to CALM
    010    $a  2014397535
    020    $a9780062287519 (hbk.)
    020    $a0062287516 (hbk.)
    035    $a(OCoLC)ocn828486868
    040    $aBTCTA$beng$cBTCTA$erda$dYDXCP$dBDX$dFOLLT$dCO2$dVP@$dUIU$dNDS$dDLC
    042    $alccopycat
    050 00 $aPZ7.Z7798$bDo 2013
    082 04 $a[E]$223
    100 1  $aZuckerberg, Randi,$eauthor.
    245 10 $aDot. /$cRandi Zuckerberg ; illustrated by Joe Berger.
    250    $aFirst Edition.
    264  1 $aNew York, NY :$bHarper, an imprint of HarperCollinsPublishers,$c[2013]
    300    $a32 unnumbered pages :$bcolor illustrations ;$c27 cm
    336    $atext$2rdacontent
    337    $aunmediated$2rdamedia
    338    $avolume$2rdacarrier
    521 1  $aAges 4-8.
    520    $aDot's a spunky little girl well versed in electronic devices. Dot knows a lot. She knows how to tap... to swipe... to share... and she pays little attention to anything else, until one day Dot sets off on an interactive adventure with the world surrounding her. Dot's tech-savvy expertise, mingled with her resourceful imagination, proves Dot really does know lots and lots.
    650  0 $aGirls$vJuvenile fiction.
    650  0 $aTechnology and children$vJuvenile fiction.
    650  0 $aInternet and children$vJuvenile fiction.
    650  0 $aPlay$vJuvenile fiction.
    650  0 $aPicture books for children.
    650  1 $aGirls$vFiction.
    650  1 $aTechnology$vFiction.
    650  1 $aAdventure and adventurers$vFiction.
    655  7 $aPicture books for children.$2lcsh
    655  7 $aAdventure fiction.$2gsafd
    700 1  $aBerger, Joe,$d1970-$eillustrator.
    tweaks:
    tag 245 old subField "a": "Dot. /"
    tag 245 new subField "a": "Dot."
    tag 245 old subField "c": "Randi Zuckerberg ; illustrated by Joe Berger."
    tag 245 new subField "c": "Randi Zuckerberg ; illustrated by Joe Berger"
    tag 300 old subField "a": "32 unnumbered pages :"
    tag 300 new subField "a": "32 unnumbered pages"
    tag 300 old subField "a": "32 unnumbered pages"
    tag 300 new subField "a": "32 unnumbered"
    tag 300 add subField "f": "pages"
    tag 020 del subField "a": "9780062287519 (hbk.)"
    tag 020 sav subField "a": "0062287516 (hbk.)"
    specify an output file to save the above tweaks

Note that since the command also included an ISBN number, the "tweaks" included deleting all
but the matching ISBN number.  If no ISBN number is specified, then all ISBN numbers are retained.
