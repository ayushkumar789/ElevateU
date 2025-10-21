"use client";
export default function TeamGrid(){
    const team = [
        { name:"Varshith Reddy", role:"22EG110B50", img:"/team/member1.jpg", linkedin:"https://www.linkedin.com/in/ramidi-varshith-reddy-8a5661287?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
        { name:"J. Prem", role:"23EG510B04", img:"/team/member2.jpg", linkedin:"https://www.linkedin.com/in/jakka-durga-venkata-prem?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
        { name:"K.Uday Sai", role:"22EG110B30", img:"/team/member3.jpg", linkedin:"https://www.linkedin.com/in/uday-sai-0b26a527a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
    ];
    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-bold">Our Team</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {team.map((t,i)=>(
                    <div key={i} className="card text-center">
                        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-zinc-800">
                            {/* Put your images under /public/team/.. or use placeholders */}
                            <img src={t.img} alt={t.name} className="w-full h-full object-cover"/>
                        </div>
                        <div className="mt-2 font-semibold">{t.name}</div>
                        <div className="text-xs opacity-70">{t.role}</div>
                        <a className="link text-sm mt-2 inline-block" href={t.linkedin} target="_blank">LinkedIn</a>
                    </div>
                ))}
            </div>
        </section>
    );
}
