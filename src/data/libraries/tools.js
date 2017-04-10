module.exports = {
    title: 'Tools',
    items: [
        {
            title: 'Semann - semantic annotator',
            glyphicon: 'indent-right',
            desc: 'Enhance any content with annotations from various sources (e.g. DBpedia). The project provides a JavaScript SDK which shows a widget with relevant entities for the text being analyzed which can be selected for inclusion on the target content in various ways (e.g. RDFa attributes, inclusion to sidebars, footers, injected paragraphs etc.). The backends that analyze the content are invoked using adapters (currently Apache Stanbol, others will follow). The SDK is designed to allow annotations on any web sites / apps which will involve some programming effort to get it running - however there are standard integrations for common editors and systems (currently CKEditor, more to come).',
            badges: {
                demo: 'https://netresearch.github.io/semann',
                semann: 'github',
                'semann-adapters': 'github'
            }
        },
        {
            title: 'AssetPicker',
            glyphicon: 'hand-up',
            desc: 'AssetPicker is a free asset or file picker designed to be easily included into web application interfaces. It has a file abstraction layer allowing adapters to connect to any remote storage, be it cloud storages like Amazon S3, Google Drive or Dropbox or assets from a custom web application server. In opposite to other file managers or pickers, AssetPicker is suitable for hierarchical as well as associative file storages.',
            badges: {
                demo: 'https://netresearch.github.io/assetpicker',
                assetpicker: ['github', 'npm', 'packagist'],
                'assetpicker-bundle': ['packagist']
            }
        },
        {
            title: 'Timetracker',
            glyphicon: 'time',
            desc: 'Timetracker is an extensive timetracking solution built on Symfony and ExtJS with JIRA integration (multiple JIRA-Instances possible), reporting, user management, CSV-Export on monthly basis and many more.',
            badges: {
                timetracker: 'github',
                timalytics: 'github'
            }
        },
        {
            title: 'Kite',
            glyphicon: 'send',
            desc: 'Kite is a build and automation tool inspired by TYPO3.Surf, written in PHP and utilizing PHP for configuration. It\'s easy to use, flexible, node based and fail safe. It makes Netresearchs projects fly.',
            badges: {
                kite: ['packagist', 'github', 'travis']
            }
        }
    ]
};