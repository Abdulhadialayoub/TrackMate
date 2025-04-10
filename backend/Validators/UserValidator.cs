using FluentValidation;
using TrackMate.API.Models.DTOs;

namespace TrackMate.API.Validators
{
    public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
    {
        public CreateUserDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(100).WithMessage("Email cannot exceed 100 characters");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(6).WithMessage("Password must be at least 6 characters")
                .MaximumLength(100).WithMessage("Password cannot exceed 100 characters");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .MaximumLength(50).WithMessage("First name cannot exceed 50 characters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters");

            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Username is required")
                .MaximumLength(50).WithMessage("Username cannot exceed 50 characters");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Phone is required")
                .MaximumLength(20).WithMessage("Phone cannot exceed 20 characters");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required")
                .Must(role => role == "Admin" || role == "User" || role == "Dev")
                .WithMessage("Role must be either 'Admin', 'User' or 'Dev'");

            RuleFor(x => x.CompanyId)
                .NotEmpty().WithMessage("Company ID is required");
        }
    }

    public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
    {
        public UpdateUserDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .MaximumLength(100).WithMessage("Email cannot exceed 100 characters");

            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required")
                .MaximumLength(50).WithMessage("First name cannot exceed 50 characters");

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required")
                .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters");

            RuleFor(x => x.Username)
                .NotEmpty().WithMessage("Username is required")
                .MaximumLength(50).WithMessage("Username cannot exceed 50 characters");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Phone is required")
                .MaximumLength(20).WithMessage("Phone cannot exceed 20 characters");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role is required")
                .Must(role => role == "Admin" || role == "User" || role == "Dev")
                .WithMessage("Role must be either 'Admin', 'User' or 'Dev'");
        }
    }
} 