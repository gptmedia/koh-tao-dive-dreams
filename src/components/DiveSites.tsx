
import React from 'react';
import diveSitesData from '../data/dive-sites.json';

const DiveSites = () => {
	const diveSites = Object.entries(diveSitesData);

	return (
		<section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-emerald-50">
			<div className="max-w-5xl mx-auto">
				<h2 className="text-3xl font-bold mb-8 text-center text-blue-900">Koh Tao Dive Sites</h2>
				<div className="grid gap-8 md:grid-cols-2">
					{diveSites.map(([key, site]: [string, any]) => (
						<div key={key} className="rounded-xl shadow-lg bg-white p-6 flex flex-col md:flex-row gap-6 items-start hover:shadow-2xl transition">
							{site.images && site.images.length > 0 && (
								<img
									src={site.images[0]}
									alt={site.name}
									className="w-full md:w-48 h-40 object-cover rounded-lg border border-blue-100"
									loading="lazy"
								/>
							)}
							<div className="flex-1">
								<h3 className="text-xl font-semibold text-emerald-700 mb-2">{site.name}</h3>
								<p className="text-gray-700 mb-3">{site.overview}</p>
								<ul className="text-sm text-gray-600 mb-2 space-y-1">
									<li><strong>Depth:</strong> {site.quickFacts?.depth}</li>
									<li><strong>Difficulty:</strong> {site.quickFacts?.difficulty}</li>
									<li><strong>Location:</strong> {site.quickFacts?.location}</li>
									<li><strong>Best Time:</strong> {site.quickFacts?.bestTime}</li>
								</ul>
								{site.whatYouCanSee && (
									<div className="text-xs text-gray-500"><strong>What you can see:</strong> {site.whatYouCanSee.join(', ')}</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default DiveSites;
