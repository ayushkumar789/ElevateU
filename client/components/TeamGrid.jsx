"use client";
export default function TeamGrid(){
    const team = [
        { name:"Member 1", role:"Developer", img:"/team/member1.jpg", linkedin:"https://www.linkedin.com/" },
        { name:"Member 2", role:"Developer", img:"/team/member2.jpg", linkedin:"https://www.linkedin.com/" },
        { name:"Member 3", role:"Developer", img:"/team/member3.jpg", linkedin:"https://www.linkedin.com/" },
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
