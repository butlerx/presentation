---
title: Keeping data encrypted in memory with confidential computing
date: 2024-02-21T15:00:00Z
description:
  An intro to confidential Computing and attestation and how you can use them to
  protect users data at Runtime from prying eyes
author: 'Cian Butler <cian@evervault.com>'
slideOptions:
  theme: evervault
---

## Keeping data encrypted in memory with confidential computing

_Cian Butler SRE@Evervault_

---

## Encrypt all the things.

<p class="fragment fade-up">Encryption at Rest</p>
<p class="fragment fade-up">Encrypted Protocols</p>
<p class="fragment fade-in-then-semi-out">Whats missing?</p>
<p class="fragment fade-up">Encryption in memory</p>

Notes:

We have on disk encryption. This can take the form of an encrypted file or an
encrypted value in a database. This is a pretty well understood space.

We have encrypted connection to servers: TLS, SSH and many more.

But we are still missing something. At some point we need to decrypt this data.

Once the data has been decrypted anyone with access to your machine and the
right permissions can see whats happening.

---

## Enclaves

<svg width="50%" height="50%" viewBox="0 0 687 566" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M241.193 93.3375L171.382 133.811C163.978 138.104 159.42 146.015 159.42 154.574V235.063C159.42 243.572 163.926 251.445 171.263 255.756L241.073 296.769C248.578 301.178 257.883 301.178 265.388 296.769L335.198 255.756C342.535 251.445 347.041 243.572 347.041 235.063V154.574C347.041 146.015 342.483 138.104 335.079 133.811L265.268 93.3375C257.823 89.0213 248.638 89.0213 241.193 93.3375Z" fill="#6633EE" stroke="white" stroke-width="1.5"></path><path d="M244.263 127.93L196.114 155.762C191.477 158.442 188.621 163.392 188.621 168.748V224.013C188.621 229.338 191.445 234.265 196.04 236.956L244.189 265.159C248.871 267.901 254.669 267.901 259.351 265.159L307.5 236.956C312.095 234.265 314.919 229.338 314.919 224.013V168.748C314.919 163.392 312.063 158.442 307.425 155.762L259.277 127.93C254.632 125.245 248.908 125.245 244.263 127.93Z" fill="#171717" fill-opacity="0.7" stroke="white" stroke-width="1.5"></path><path d="M161.15 142.667L252.771 195.96L345 142" stroke="white" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="bevel"></path><path d="M252.771 195.96V300.356" stroke="white" stroke-opacity="0.4" stroke-linecap="round"></path><path d="M56.6421 236.706L8.49333 264.538C3.85607 267.218 1 272.168 1 277.524V332.789C1 338.115 3.82355 343.041 8.41869 345.732L56.5675 373.935C61.2496 376.678 67.0479 376.678 71.7301 373.935L119.879 345.732C124.474 343.041 127.298 338.115 127.298 332.789V277.524C127.298 272.168 124.441 267.218 119.804 264.538L71.6554 236.706C67.011 234.022 61.2865 234.022 56.6421 236.706Z" fill="white" fill-opacity="0.1" stroke="white" stroke-width="1.5"></path><path d="M3.19043 269.599L64.1491 305.007L125.108 269.599" stroke="white" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="bevel"></path><path d="M64.1484 305.007L64.1484 376.186" stroke="white" stroke-opacity="0.4" stroke-linecap="round"></path><circle cx="4" cy="4" r="4" transform="matrix(0.866009 0.500028 3.1686e-05 1 216.902 208.276)" fill="white"></circle><path d="M124.5,270L220.378,214.299" stroke="white" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path d="M64 222L64 142" stroke="white" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path d="M287,486L287,566" stroke="white" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path d="M253 79L253 0" stroke="white" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path d="M476 171L476 92" stroke="white" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path d="M464.193 188.979L394.382 229.453C386.978 233.746 382.42 241.657 382.42 250.216V330.704C382.42 339.214 386.926 347.087 394.263 351.397L464.073 392.411C471.578 396.82 480.883 396.82 488.388 392.411L558.198 351.397C565.535 347.087 570.041 339.214 570.041 330.704V250.216C570.041 241.657 565.483 233.746 558.079 229.453L488.268 188.979C480.823 184.663 471.638 184.663 464.193 188.979Z" fill="#6633EE" stroke="white" stroke-width="1.5"></path><path d="M467.263 223.571L419.114 251.403C414.477 254.084 411.621 259.033 411.621 264.39V319.654C411.621 324.98 414.445 329.906 419.04 332.598L467.189 360.8C471.871 363.543 477.669 363.543 482.351 360.8L530.5 332.598C535.095 329.906 537.919 324.98 537.919 319.654V264.39C537.919 259.033 535.063 254.084 530.425 251.403L482.277 223.571C477.632 220.887 471.908 220.887 467.263 223.571Z" fill="#171717" fill-opacity="0.7" stroke="white" stroke-width="1.5"></path><path d="M384.15 238.308L475.771 291.602L568 237.641" stroke="white" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="bevel"></path><path d="M475.771 291.602V395.998" stroke="white" stroke-opacity="0.4" stroke-linecap="round"></path><path d="M279.642 332.348L231.493 360.179C226.856 362.86 224 367.81 224 373.166V428.431C224 433.756 226.824 438.682 231.419 441.374L279.567 469.577C284.25 472.319 290.048 472.319 294.73 469.577L342.879 441.374C347.474 438.682 350.298 433.756 350.298 428.431V373.166C350.298 367.81 347.441 362.86 342.804 360.179L294.655 332.348C290.011 329.663 284.286 329.663 279.642 332.348Z" fill="white" fill-opacity="0.1" stroke="white" stroke-width="1.5"></path><path d="M226.19 365.241L287.149 400.648L348.108 365.241" stroke="white" stroke-opacity="0.4" stroke-linecap="round" stroke-linejoin="bevel"></path><path d="M287.148 400.648L287.148 471.827" stroke="white" stroke-opacity="0.4" stroke-linecap="round"></path><circle cx="4" cy="4" r="4" transform="matrix(0.866009 0.500028 3.1686e-05 1 439.902 303.917)" fill="white"></circle><path d="M347.5,365.641L443.378,309.94" stroke="white" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path d="M511 345L559.5 373.5" stroke="white" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="1px 1px"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M104.497 312.328C104.775 312.488 104.775 313.008 104.497 313.49L94.9733 329.985C94.6891 330.477 94.2261 330.736 93.9513 330.556L88.3496 326.891C88.0809 326.715 88.0954 326.187 88.3821 325.711L89.9388 323.127C90.2254 322.651 90.6756 322.408 90.9443 322.584L94.5364 324.934L101.982 312.038C102.26 311.557 102.71 311.297 102.988 311.457L104.497 312.328Z" fill="white" opacity="1" style="transform: none; transform-origin: 96.4314px 321.012px 0px;" transform-origin="96.43135452270508px 321.01153564453125px"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M316.904 419.539L312.801 417.17C312.469 416.978 312.469 416.357 312.801 415.782L314.604 412.659C314.936 412.084 315.475 411.773 315.807 411.965L319.805 414.273L323.469 407.625C323.79 407.043 324.328 406.711 324.671 406.883L326.535 407.816C326.878 407.988 326.897 408.598 326.576 409.179L322.812 416.009L327.354 418.632C327.686 418.823 327.686 419.445 327.354 420.02L325.551 423.143C325.219 423.718 324.681 424.029 324.349 423.837L319.91 421.275L315.836 428.668C315.516 429.249 314.978 429.581 314.634 429.409L312.77 428.477C312.427 428.305 312.409 427.695 312.729 427.113L316.904 419.539Z" fill="white" opacity="1" style="transform: none; transform-origin: 320.052px 418.146px 0px;" transform-origin="320.05169677734375px 418.14599609375px"></path><text x="72" y="156" fill="white" font-size="19px" opacity="1" style="transform: none; transform-origin: 97.9507px 149.113px 0px;" transform-origin="97.95073127746582px 149.11347579956055px">Client</text><text x="296" y="565" fill="white" font-size="19px" opacity="1" style="transform: none; transform-origin: 321.951px 558.113px 0px;" transform-origin="321.9507312774658px 558.1134757995605px">Client</text><text x="486" y="107" fill="white" font-size="19px" opacity="1" style="transform: none; transform-origin: 554.578px 100.113px 0px;" transform-origin="554.5783386230469px 100.11347579956055px">Secure
Enclave</text><text x="262" y="15" fill="white" font-size="19px" opacity="1" style="transform: none; transform-origin: 330.578px 8.11347px 0px;" transform-origin="330.5783386230469px 8.11347246170044px">Secure
Enclave</text><g style="transform: matrix(0.87, 0.5, -0.87, 0.5, 0, 0);"><text x="706" y="59" fill="white" font-size="19px" opacity="1" style="transform: none; transform-origin: 771.732px 52.1135px 0px;" transform-origin="771.7319030761719px 52.11347198486328px">Code
changed</text></g></svg>

Notes:

The industry solution for this is enclaves. Enclaves go by many names, sometimes
called TEE.

- Intel SGX and TDX
- AMD SEV-SNP
- ARM Trust zones CCA

Those are all hardware for implementing these solutions while AWS have
NitroEncalves.

You likely use an enclave everyday without realising it. They are commenly used
for mobile wallets and key storage in phones.

===

## Lots of 3 letter acronyms

![A diagram showing the breakdown of tee techs and their isolation models](/img/techweek-2024/tee-overview.png)

Notes:

Enclaves break down into different varieties.

Applications Enclaves are specially designed applications that are used to
secure computation. These apps use specific syscalls to move there processing to
secure chips on the hardware.

We have two type of vm based enclaves. VM based enclaves are used to provide
secure sidecars for doing compute. They have their own OS and will have a side
channel of sorts to allow the host to communicate with them.

Arm TrustZones and similar are used in phones for mobile wallets. They have
custom OSes and will talk have an API/RPC system for communicating.

The other style of VM's look like regular machines. You can run any OS or
application you want on them. You'll again have a side channel it'll use to
communicate with the main host.

---

## The Problems

- Observability
- Userspace Networking
- Time slippage

Notes:

Unfortunately running enclaves is not as easy as running something like a VM or
docker. A lot of the issues we ran into will be no surprise to many people.

===

## Observability

<img src="/img/enclavesInProd/k1-r1.png" width="500px" alt="Loadtest Graphs showing performance improvements moving from k1 to r1 curve">
<img alt="Loadtest Graphs showing performance improvements moving from m5 to c5 nodes" src="/img/enclavesInProd/m5-c5.png" width="500px">

Notes:

In all forms of enclaves you'll have no shell, no logs or any of your standard
obs tooling.

When we started to have performance issues in prod we had to resort to black box
loadtesting. This means we added metrics and logs to the client that
communicates to the side channel so we could get a sense of what kind of
workloads produce what kind of results.

Eventually we had to actually implement a concept of traces into the enclave.
The Service would create a trace for each request store the finished trace and
all its meta in a buffer that would periodically be flushed to a reporter on the
host node for forwarding on to the central trace infra.

===

## Userspace Networking

![Graph showing performance difference show running a network request in a vm vs an enclave. Enclave is much lower then vm](/img/enclavesInProd/Request-Volume-Metrics.png)

Notes:

Now that we could see what was actually happening in the enclaves we noticed a
disturbing performance difference for certain processes and requests in the
enclave.

Any Service that communicated to another process in the enclave over local host
had a massive performance impact on requests. We believe that this is due to the
network being in userspace. We are hoping to try short circut this using sockmap
between processes but this is still being tested. If anyone else has had similar
issues id love to talk about it with them after.

===

## Time slippage

There is no NTP in enclaves.

Notes:

Given we are running in an enclave we have no or limited network which means
many things don't just work. Given the lack of standard networking access we
notices that our enclaves would slip about 1 second a day, based on traffic
volume. Not much but enough that after running for a few days we'd begin to to
notice errors with anything time sensitive such as token validation.

---

## Attestation

Notes:

Now enclaves arnt all pain. They have some cool stuff.

You can attest the environment you are connecting to be that remotely or locally
is 100% the code you deployed.

This work by at build time for your image hashing all the software you used to
generate a shared hash that is signed by your private ca. that hash is given to
a client. When the client connects to the enclave you have the enclave return
its current hash. The client then can compare this against the Hash it expects
and validates the signature with the public ca and if it fails to validate the
connection is killed and data is never transferred.

This attestation can also be done by the HW To validate that the image being
deployed is the expected image and by the process in the image to the HW to
ensure that the hw hasnt been tampered with.

If any of these validations fail we can kill the process and stop an attacker
getting access to our secure data.

---

# Questions?
