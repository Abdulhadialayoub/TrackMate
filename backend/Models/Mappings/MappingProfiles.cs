using AutoMapper;
using TrackMate.API.Models.DTOs;
using TrackMate.API.Models.Entities;

namespace TrackMate.API.Models.Mappings
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            // User mappings
            CreateMap<User, UserDto>()
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));
            
            // Add missing mapping from CreateUserDto to User
            CreateMap<CreateUserDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore()); // Password is hashed in the service
            
            // Add mapping from UpdateUserDto to User
            CreateMap<UpdateUserDto, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
            
            // Company mappings
            CreateMap<Company, CompanyDto>();
            CreateMap<CreateCompanyDto, Company>();
            CreateMap<UpdateCompanyDto, Company>();

            // Other entity mappings can be added here as needed
        }
    }
} 