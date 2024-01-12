import { expect } from 'chai';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture } from '../../astro/test/test-utils.js';
import testAdapter from '../../astro/test/test-adapter.js';

describe('astro:db', () => {
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/basics/', import.meta.url),
			output: 'server',
			adapter: testAdapter()
		});
	});

	describe('production', () => {
		before(async () => {
			await fixture.build();
		});

		it('Prints the list of authors', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const res = await app.render(request);
			const html = await res.text();
			const $ = cheerioLoad(html);

			const ul = $('ul');
			expect(ul.children()).to.have.a.lengthOf(5);
			expect(ul.children().eq(0).text()).to.equal('Ben');
		});

		it('Errors when inserting to a readonly collection', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/insert-into-readonly');
			const res = await app.render(request);
			const html = await res.text();
			const $ = cheerioLoad(html);

			expect($('#error').text()).to.equal('The [Author] collection is read-only.');
		});

		it('Does not error when inserting into writable collection', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/insert-into-writable');
			const res = await app.render(request);
			const html = await res.text();
			const $ = cheerioLoad(html);

			expect($('#error').text()).to.equal('');
		});
	});
});
