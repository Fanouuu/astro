import type * as vite from 'vite';
import type { AstroConfig, AstroSettings } from '../@types/astro.js';
import { AstroError } from '../core/errors/errors.js';
import { AstroErrorData } from '../core/errors/index.js';

const virtualModuleId = 'astro:i18n';
const configId = 'astro-internal:i18n-config';
const resolvedConfigId = `\0${configId}`;

type AstroInternationalization = {
	settings: AstroSettings;
};

export interface I18nInternalConfig
	extends Pick<AstroConfig, 'base' | 'site' | 'trailingSlash'>,
		NonNullable<AstroConfig['i18n']>,
		Pick<AstroConfig['build'], 'format'> {
	isBuild: boolean;
}

export default function astroInternationalization({
	settings,
}: AstroInternationalization): vite.Plugin {
	const {
		base,
		build: { format },
		i18n,
		site,
		trailingSlash,
	} = settings.config;
	let isCommandBuild = false;

	return {
		name: 'astro:i18n',
		enforce: 'pre',
		async resolveId(id) {
			if (id === virtualModuleId) {
				if (i18n === undefined) throw new AstroError(AstroErrorData.i18nNotEnabled);
				return this.resolve('astro/virtual-modules/i18n.js');
			}
			if (id === configId) return resolvedConfigId;
		},

		config(opts, { command }) {
			isCommandBuild = command === 'build';
			return opts;
		},
		load(id) {
			if (id === resolvedConfigId) {
				const { defaultLocale, locales, routing, fallback, domains } = i18n!;
				const config: I18nInternalConfig = {
					base,
					format,
					site,
					trailingSlash,
					defaultLocale,
					locales,
					routing,
					fallback,
					domains,
					isBuild: isCommandBuild,
				};
				return `export default ${JSON.stringify(config)};`;
			}
		},
	};
}
