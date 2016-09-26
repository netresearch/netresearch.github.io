module.exports = {
    title: 'TYPO3',
    items: [
        {
            title: 'Multi-channel contexts',
            img: 'contexts.png',
            desc: 'Contexts is a set of TYPO3 extension that allows to control record (content elements and pages by default) visibility based on several conditions grouped as so called contexts. Such conditions can be IP ranges, user location, device types, GET parameters, HTTP headers, domains and logical combinations of contexts.',
            badges: {
                contexts: 'ter',
                contexts_geolocation: 'ter',
                contexts_wurfl: 'ter',
                't3x-contexts': 'travis'
            },
            more: {
                'https://www.netresearch.de/blog/typo3-contexts/': 'Announcement (german)',
                'http://t3n.de/magazin/erweiterung-ermoeglicht-kontextabhaengige-darstellung-234115/': 'Article on t3n (german)',
                'https://www.youtube.com/watch?v=ft2aQ0qQUrc&list=PL-sDBIrOKGOZ3ZrwFpyl0El1Oh51VUl38&index=3': 'Presentation at T3CON 2014 (eehm)'
            }
        },
        {
            title: 'TYPO3 performance analysis',
            glyphicon: 'dashboard',
            desc: 'This TYPO3 extension tracks frontend rendering timing and quantity information and displays a summary at the bottom right of the frontend pages. By default it tracks rendering time of the server and browser, and the number of SQL queries and the total time needed for them. Additionally extensions can track custom information into other groups.',
            badges: {
                nr_perfanalysis: 'ter'
            }
        },
        {
            title: 'DAM to FAL migration',
            glyphicon: 'folder-open',
            desc: 'We provide two extensions that make the switch from the deprecated <em>Digital Asset Management (DAM)</em> extension to the new core <em>File Abstraction Layer (FAL)</em> as easy as possible.'
            + 'With <code>nr_dam_falmigration</code> you can easily migrate the DAM records to FAL records on database level from the upgrade wizard or from command line (you don\'t need the files to be locally available). The extension maps the default fields and tables but you can add additional extension fields to be migrated if you need. Unlike other migration extensions it works extremely fast (~100k of records in ~2 min).'
            + 'After that the compatibility layer extension <code>dam_compat</code> provides the old DAM API methods using FAL files enabling you to make the switch without any further code or extension changes.',
            badges: {
                nr_dam_falmigration: 'ter',
                dam_compat: 'ter'
            }
        },
        {
            title: 'Caching Framework',
            devicon: 'redis',
            desc: 'This extension provides functionality to store cache data in memory based caching systems like Couchbase, Redis, Memcache or Amazon ElastiCache. Including PHP code cache and function results - move your typo3temp cache folders into Redis. It contains a streamwrapper to store PHP code cache in caching framework, a Couchbase caching framework backend and a function cache as callable caching frontend.',
            badges: {
                nr_cache: 'ter'
            }
        },
        {
            title: 'Distributed lock manager',
            glyphicon: 'lock',
            desc: 'NR_Lock is a distributed lock manager (DLM). It\'s designed for multiple TYPO3 frontend servers using a single typo3temp share and Database. NR_Lock currently supports single Redis or Couchbase (experimental) caching server as locking instance. It replaces/extends the TYPO3 lock facility t3lib_lock.',
            badges: {
                nr_lock: 'ter'
            }
        },
        {
            title: 'Session',
            glyphicon: 'barcode',
            desc: 'This extension acts as alternative session handler and provides an interface for a more secure, scalable and faster session data storage as well as more secure session id handling. It uses the caching framework to store session data and allows you to configure every caching framework backend to store session data. Also it validates generated session ids against the session storage for uniqueness and checks every newly generated session id for uniqueness to ensure security and data privacy.',
            badges: {
                nr_session: 'ter'
            }
        },
        {
            title: 'Cache test plugins',
            glyphicon: 'lamp',
            desc: 'Provides cached and uncached TYPO3 plugins that render the current time. Each has an option to sleep for a certain amount of seconds. The plugins are helpful for testing concurrent accesses and locking/caching implementations in TYPO3.',
            badges: {
                nr_cachetest: 'ter'
            }
        },
        {
            title: 'Semantic Templates',
            glyphicon: 'link',
            desc: 'This extension displays HTML templates from a LESS installation in TYPO3 pages.'
            + 'LESS is a web application to create HTML templates and fill them with data from the semantic web (linked data: RDF, RDFa; and SPARQL query results).'
            + 'You can use it to display data from i.e. the Wikipedia on your TYPO3 page. Your page updates automatically when the data in Wikipedia change, and with LESS you have a central place to manage the layout of your template. Other people can improve your templates or add new ones, ready for you to use.'
            + 'Apart from Wikipedia, you can make use of any data that are available as Linked Data (RDF/RDFa) or via SPARQL queries. FOAF profiles of people are a good example for RDF data.',
            badges: {
                't3x-nr_semantic_templates': 'github'
            }
        },
        {
            title: 'Content Delivery Network Tools',
            glyphicon: 'cloud-download',
            desc: 'This extension will link static media in your page to your Content Delivery Network (CDN) or just any other static server for media delivery, so you can use your full featured CDN or just use some lightweight fast http server like Lighttpd to deliver content to your customers faster and offload traffic from your CMS servers.',
            badges: {
                't3x-nr_cdn': 'github'
            }
        },
        {
            title: 'Pagetree',
            glyphicon: 'tree-deciduous',
            desc: 'Provides extended functionality for the pagetree, such as showing non page records (plain or hierarchical) and wiring them to custom pages. This is a big usability enhancement for hierarchical records that you usually could only manage in plain lists with the list module.',
            badges: {
                't3x-nr_pagetree': 'github'
            }
        }
    ]
};