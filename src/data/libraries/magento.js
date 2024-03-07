module.exports = {
    title: 'Magento',
    devicon: 'magento-original colored',
    link: 'https://www.netresearch.de/magento/',
    linktext: 'Netresearch also offers Magento special services for B2C and B2B including DevOps, operations, support, upgrades and migrations.',
    items: [
        {
            title: 'DHL Shipping module for Magento 2',
            glyphicon: 'equalizer',
            desc: 'This extension integrates the Deutsche Post DHL Group Business Customer Shipping API (GKP Versenden) into the Magento 2 order processing workflow.',
            badges: {
                'dhl-module-shipping-m2': 'github'
            },
            more: {
                'http://dhl.support.netresearch.de/support/home': 'DHL Module Support (german/ english)'
            },
        },
        {
            title: 'API import CLI script',
            glyphicon: 'console',
            desc: 'Provides a PHP command line script for interaction with the ApiImport module for Magento. The repository also contains real live example data.',
            badges: {
                'mage-api-import-cli': 'github'
            }
        },
        {
            title: 'Jumpstorm',
            glyphicon: 'ice-lolly-tasted',
            desc: 'Jumpstorm wants to help you concentrate on the task you have to do. No more time has to be wasted for Magento setup. It even could setup your Magento automatically, so it can even be used for demo or test systems.'
            + 'Its flexible architecture allows you to extend its functionality as you need.'
            + 'For extension with modman support, deployment is done with modman, so you\'ll get a ready-to-use installation at the end. All the other extensions, e.g. from Magento Connect will be hard-copied to your Magento.',
            badges: {
                jumpstorm: 'github',
                'jumpstorm-zsh-plugin': 'github'
            }
        },
        {
            title: 'Live translator',
            glyphicon: 'flag',
            desc: 'This extension provides the ability to enable inline translation from backend just for the current user. Activates inline translation in Magento for a single user by clicking a link, which is valid for up to 2 minutes only.',
            badges: {
                'Magento-Livetranslator': 'github'
            }
        },
        {
            title: 'CMS Relations',
            glyphicon: 'transfer',
            desc: 'Magento module to create relations between cms pages. With this it\'s for example possible to redirect to a translated cms page after language switching.',
            badges: {
                CmsRelations: 'github'
            }
        },
        {
            title: 'node-magento-eqp',
            glyphicon: 'transfer',
            desc: 'A simple API wrapper around the Magento Marketplace EQP API.',
            badges: {
                'node-magento-eqp': ['github', 'npm']
            }
        },
        {
            title: 'node-red-contrib-magento-eqp',
            devicon: 'javascript-plain',
            desc: 'Node-RED module to parse Magento EQP callbacks',
            badges: {
                'node-red-contrib-magento-eqp': ['github', 'npm']
            }
        }
    ]
};