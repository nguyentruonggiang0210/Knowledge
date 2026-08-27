using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace GraphQLFromConsole
{
    public class Startup
    {
        public Startup()
        {
            
        }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("Defau")));

            services
                .AddGraphQLServer()
                .AddQueryType<Query>()
                .AddType<ProductType>();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            // ... other middleware ...

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapGraphQL();
            });
        }
    }
}
