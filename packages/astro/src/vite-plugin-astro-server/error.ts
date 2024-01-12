import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroConfig } from '../@types/astro.js';
import type DevPipeline from './devPipeline.js';

import { collectErrorMetadata } from '../core/errors/dev/index.js';
import { createSafeError, AstroErrorData } from '../core/errors/index.js';
import { formatErrorMessage } from '../core/messages.js';
import { eventError, telemetry } from '../events/index.js';

export function recordServerError(
	loader: ModuleLoader,
	config: AstroConfig,
	pipeline: DevPipeline,
	_err: unknown
) {
	const err = createSafeError(_err);

	// This could be a runtime error from Vite's SSR module, so try to fix it here
	try {
		loader.fixStacktrace(err);
	} catch {}

	// This is our last line of defense regarding errors where we still might have some information about the request
	// Our error should already be complete, but let's try to add a bit more through some guesswork
	const errorWithMetadata = collectErrorMetadata(err, config.root);

	// Ignore unhandled rejection errors as they appear A LOT and we cannot record the amount to telemetry
	if (errorWithMetadata.name !== AstroErrorData.UnhandledRejection.name) {
		telemetry.record(eventError({ cmd: 'dev', err: errorWithMetadata, isFatal: false }));
	}

	pipeline.logger.error(
		null,
		formatErrorMessage(errorWithMetadata, pipeline.logger.level() === 'debug')
	);

	return {
		error: err,
		errorWithMetadata,
	};
}
