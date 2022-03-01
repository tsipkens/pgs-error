
% COVF  Estimate covariance matrix by fitting an error model.
%  
%   COVF(X) For matrices, where each row of X is an observation, 
%   and each column a variable, COVF(X) is the covariance matrix.  
%   DIAG(COVF(X)) is a vector of variances for each column, 
%   and SQRT(DIAG(COVF(X))) is a vector of standard deviations. 
%   By default, fitting assumes Poisson noise.
%   
%   COVF(X,MODEL) adds a string containing model information. 
%   Options include:
%    'p'        Poisson noise model
%    'pg'       Poisson-Gaussian error model
%    'pgm'      Poisson-Gaussian-multiplicative (PGM) error model
%    'pgm-c'    PGM error model with correlated multiplicative errors
%    '*-ed'     Add exponential distance covariance information
%   
%   COVF(X,STD) uses the standard deviation STD and assumes the 
%   PGM error model. 
%   
%   COVF(X,MODEL,DIM) adds a dimension argument. Default is DIM = 1. 
%   DIM = 2 transposes the data, corresponding to where each row is a 
%   variable.
%  
%   COVF(...,F_PLOT) adds a flag for whether or not to show a diagnostic 
%   plot, which shows the adequacy of the fitting procedure. 
%   
%   -----------------------------------------------------------------------
%  
%   AUTHOR: Timothy Sipkens, 2022-02-08

function [c, xlsq] = covf(x, model, dim, f_plot)

%-- Handle inputs --------------------------------------------------------%
% Type of error model.
if ~exist('model', 'var'); model = []; end
if isempty(model); model = 'pgm'; end
if isnumeric(model)  % actually a std. dev.
    t = model;
    model = 'pgm';
end

% Dimenion over which to consider covariance.
if ~exist('dim', 'var'); dim = []; end
if isempty(dim); dim = 1; end
if dim == 2; x = x'; end

% Flag for diagnostic plot.
if ~exist('f_plot', 'var'); f_plot = []; end
if isempty(f_plot); f_plot = 0; end

opts.Display = 'none';
%-------------------------------------------------------------------------%

% Get mean and standard deviation.
if exist('t', 'var')  % if model is std. devs.
    s = x;
    sig = t;
else
    s = mean(x);
    sig = std(x);
end
    
% Modify depending on 0s and infs. 
s(isinf(s)) = NaN;  % replace infinite values
sig(isinf(sig)) = NaN;
s(s==0) = NaN;  % replace all zero values
sig(sig==0) = NaN;

% Get minimization function, depending on the error model.
% Fitting only occurs for the variance, at this point.
switch model
    case {'p', 'p-ed'}
        x0 = 1;
        fun = @(x, s) x .* s;
        min_fun = @(x) log(fun(x, s)) - log(sig .^ 2);

    case {'pg', 'pg-ed'}
        x0 = [1, min(sig(sig~=0))];
        fun = @(x, s) x(1) .* s + x(2) .^ 2;
        min_fun = @(x) log(fun(x, s)) - log(sig .^ 2);
        
    case {'pgm-c', 'pgm', 'pgm-ed'}
        % Fit a quadratic curve.
        % See Sipkens et al. for why this works.
        xg = min(sig(sig~=0));
        xp = fminsearch(@(x) ...
            norm(log(sig .^ 2 - xg .^ 2) - ...
            real(log(x .* s))), 1, opts);
        
        x0 = [0.1, xp, xg];
        fun = @(x, s) x(1) .^ 2 .* (s .^ 2) + ...
            x(2) .* s + x(3) .^ 2;
        min_fun = @(x) log(fun(x, s)) - log(sig .^ 2);
    otherwise
        error('Invalid error model.');
end

% Get error model parameters.
z = zeros(size(x0));
xlsq = fmincon( ...
    @(x) norm(min_fun(x)), ...
    x0, [], [], [], [], z, [], [], opts);

% Build variance matrix.
c = fun(xlsq, s);
c = diag(c);

%== ADDING CORRELATION ===================================================%
%   For correlated errors, add off-diagonals depending on form.
if strcmp(model, 'pgm-c')  % for correlated multiplicative errors
    c = xlsq(1) .^ 2 .* (s' * s) + diag(xlsq(2) .* s + xlsq(3) .^ 2);

elseif contains(model, '-ed')  % for exponential distrance correlation
    cin = cov(x);
    [~, cin] = cov2corr(cin);
    
    % Get distance between points.
    v = 1:length(s);
    d = (v' - v) .^ 2;

    % Estimate the correlation length based on the covariance.
    l = fmincon(@(x) norm(exp(-d ./ x) - cin) ^ 2, 0.1, ...
        [], [], [], [], 0, [], [], opts);
    
    % Build covairance matrix based on selected error model 
    % and the estimated correlation length. 
    c = exp(-d ./ l) .* sqrt(diag(c) * diag(c)');
end
%=========================================================================%

% Diagnostic plot.
% Show accuracy of fitting procedure.
if f_plot
    plot(s, sig .^ 2, '.');
    hold on;
    vec = logspace(log10(min(s(s > eps))), log10(max(s)), 150);
    plot(vec, fun(xlsq, vec), 'k--')
    hold off;
    set(gca, 'XScale', 'log', 'YScale', 'log');
end

end
